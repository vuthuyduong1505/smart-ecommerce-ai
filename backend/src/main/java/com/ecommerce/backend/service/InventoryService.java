package com.ecommerce.backend.service;

import com.mongodb.client.result.UpdateResult;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Date;
import java.util.List;

/**
 * Quản lý vòng đời tồn kho nguyên tử (Atomic Inventory Operations).
 * Tuân thủ nghiêm ngặt Database Specification v1.2.1 và Thiết kế Kỹ thuật 4.3:
 * 1. Reserve Stock (Khi khách bắt đầu Checkout)
 * 2. Confirm Reservation (Khi đơn hàng được xác nhận)
 * 3. Release Reservation (Khi đơn hàng bị hủy hoặc hết hạn 15 phút)
 * 4. Restore Stock (Khi đơn hàng đã confirm bị hủy)
 */
@Service
public class InventoryService {

    private static final Logger log = LoggerFactory.getLogger(InventoryService.class);
    private final MongoTemplate mongoTemplate;

    public InventoryService(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    private Object toMongoId(String id) {
        if (ObjectId.isValid(id)) {
            return new ObjectId(id);
        }
        return id;
    }

    /**
     * Thao tác 1: Reserve Stock
     * Điều kiện: (quantity - reserved) >= requestedQty
     * Hành động: Tăng reserved thêm requestedQty, cập nhật inStock nguyên tử.
     * @return true nếu giữ hàng thành công, false nếu tồn kho khả dụng không đủ
     */
    public boolean reserveStock(String productId, int requestedQty) {
        if (requestedQty <= 0) {
            return false;
        }

        Document filter = new Document("_id", toMongoId(productId))
                .append("$expr", new Document("$gte", Arrays.asList(
                        new Document("$subtract", Arrays.asList("$inventory.quantity", "$inventory.reserved")),
                        requestedQty
                )));

        List<Document> pipeline = Arrays.asList(
                new Document("$set", new Document()
                        .append("inventory.reserved", new Document("$add", Arrays.asList("$inventory.reserved", requestedQty)))
                        .append("inStock", new Document("$gt", Arrays.asList(
                                new Document("$subtract", Arrays.asList(
                                        "$inventory.quantity",
                                        new Document("$add", Arrays.asList("$inventory.reserved", requestedQty))
                                )),
                                0
                        )))
                        .append("updatedAt", new Date())
                )
        );

        UpdateResult result = mongoTemplate.getCollection("products").updateOne(filter, pipeline);
        boolean success = result.getModifiedCount() > 0;
        if (success) {
            log.info("Reserved stock SUCCESS: productId={}, qty={}", productId, requestedQty);
        } else {
            log.warn("Reserved stock FAILED (insufficient stock): productId={}, qty={}", productId, requestedQty);
        }
        return success;
    }

    /**
     * Thao tác 2: Confirm Reservation
     * Điều kiện: reserved >= confirmedQty và quantity >= confirmedQty
     * Hành động: Giảm quantity và giảm reserved đồng thời, cập nhật inStock nguyên tử.
     */
    public boolean confirmReservation(String productId, int confirmedQty) {
        if (confirmedQty <= 0) {
            return false;
        }

        Document filter = new Document("_id", toMongoId(productId))
                .append("inventory.reserved", new Document("$gte", confirmedQty))
                .append("inventory.quantity", new Document("$gte", confirmedQty));

        List<Document> pipeline = Arrays.asList(
                new Document("$set", new Document()
                        .append("inventory.quantity", new Document("$subtract", Arrays.asList("$inventory.quantity", confirmedQty)))
                        .append("inventory.reserved", new Document("$subtract", Arrays.asList("$inventory.reserved", confirmedQty)))
                        .append("inStock", new Document("$gt", Arrays.asList(
                                new Document("$subtract", Arrays.asList(
                                        new Document("$subtract", Arrays.asList("$inventory.quantity", confirmedQty)),
                                        new Document("$subtract", Arrays.asList("$inventory.reserved", confirmedQty))
                                )),
                                0
                        )))
                        .append("updatedAt", new Date())
                )
        );

        UpdateResult result = mongoTemplate.getCollection("products").updateOne(filter, pipeline);
        boolean success = result.getModifiedCount() > 0;
        log.info("Confirm reservation result: productId={}, qty={}, success={}", productId, confirmedQty, success);
        return success;
    }

    /**
     * Thao tác 3: Release Reservation
     * Điều kiện: reserved >= releasedQty
     * Hành động: Giảm reserved đi releasedQty, hoàn trả về tồn kho khả dụng.
     */
    public boolean releaseReservation(String productId, int releasedQty) {
        if (releasedQty <= 0) {
            return false;
        }

        Document filter = new Document("_id", toMongoId(productId))
                .append("inventory.reserved", new Document("$gte", releasedQty));

        List<Document> pipeline = Arrays.asList(
                new Document("$set", new Document()
                        .append("inventory.reserved", new Document("$subtract", Arrays.asList("$inventory.reserved", releasedQty)))
                        .append("inStock", new Document("$gt", Arrays.asList(
                                new Document("$subtract", Arrays.asList(
                                        "$inventory.quantity",
                                        new Document("$subtract", Arrays.asList("$inventory.reserved", releasedQty))
                                )),
                                0
                        )))
                        .append("updatedAt", new Date())
                )
        );

        UpdateResult result = mongoTemplate.getCollection("products").updateOne(filter, pipeline);
        boolean success = result.getModifiedCount() > 0;
        log.info("Release reservation result: productId={}, qty={}, success={}", productId, releasedQty, success);
        return success;
    }

    /**
     * Thao tác 4: Restore Confirmed Stock
     * Khi một đơn hàng đã được Confirm (trừ quantity) bị hủy, hoàn trả lại quantity vật lý.
     */
    public boolean restoreConfirmedStock(String productId, int restoredQty) {
        if (restoredQty <= 0) {
            return false;
        }

        Document filter = new Document("_id", toMongoId(productId));

        List<Document> pipeline = Arrays.asList(
                new Document("$set", new Document()
                        .append("inventory.quantity", new Document("$add", Arrays.asList("$inventory.quantity", restoredQty)))
                        .append("inStock", new Document("$gt", Arrays.asList(
                                new Document("$subtract", Arrays.asList(
                                        new Document("$add", Arrays.asList("$inventory.quantity", restoredQty)),
                                        "$inventory.reserved"
                                )),
                                0
                        )))
                        .append("updatedAt", new Date())
                )
        );

        UpdateResult result = mongoTemplate.getCollection("products").updateOne(filter, pipeline);
        boolean success = result.getModifiedCount() > 0;
        log.info("Restore confirmed stock result: productId={}, qty={}, success={}", productId, restoredQty, success);
        return success;
    }
}
