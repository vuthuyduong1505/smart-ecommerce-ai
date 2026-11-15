package com.ecommerce.backend.config;

import com.ecommerce.backend.model.Brand;
import com.ecommerce.backend.model.Category;
import com.ecommerce.backend.model.Inventory;
import com.ecommerce.backend.model.Product;
import com.ecommerce.backend.model.RatingSummary;
import com.ecommerce.backend.repository.BrandRepository;
import com.ecommerce.backend.repository.CategoryRepository;
import com.ecommerce.backend.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final ProductRepository productRepository;

    @Value("${app.seed.enabled:true}")
    private boolean seedEnabled;

    public DataSeeder(CategoryRepository categoryRepository,
                      BrandRepository brandRepository,
                      ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.brandRepository = brandRepository;
        this.productRepository = productRepository;
    }

    @Override
    public void run(String... args) {
        if (!seedEnabled) {
            log.info("DataSeeder is disabled via app.seed.enabled=false");
            return;
        }

        try {
            log.info("Bắt đầu kiểm tra và seed dữ liệu Catalog nền tảng...");
            seedCategoriesAndBrandsAndProducts();
            log.info("Hoàn tất quy trình seed dữ liệu Catalog thành công!");
        } catch (Exception ex) {
            log.warn("Không thể kết nối MongoDB để seed dữ liệu khởi động (MongoDB có thể chưa khởi chạy): {}", ex.getMessage());
        }
    }

    public void seedCategoriesAndBrandsAndProducts() {
        // 1. Seed Categories
        Map<String, Category> categories = seedCategories();

        // 2. Seed Brands
        Map<String, Brand> brands = seedBrands();

        // 3. Seed Laptop Products
        seedLaptopProducts(categories, brands);
    }

    private Map<String, Category> seedCategories() {
        Map<String, Category> map = new HashMap<>();

        // Root Laptop
        Category laptop = getOrCreateCategory("Laptop", "laptop", "Danh mục Máy tính xách tay Laptop công nghệ cao", null, 1);
        map.put("laptop", laptop);

        // Subcategories of Laptop
        Category laptopGaming = getOrCreateCategory("Laptop Gaming", "laptop-gaming", "Laptop chơi game hiệu năng cao, card đồ họa rời", laptop.getId(), 1);
        map.put("laptop-gaming", laptopGaming);

        Category laptopOffice = getOrCreateCategory("Laptop Văn Phòng", "laptop-van-phong", "Laptop văn phòng mỏng nhẹ, pin trâu, sang trọng", laptop.getId(), 2);
        map.put("laptop-van-phong", laptopOffice);

        // Other Root Categories
        map.put("phone", getOrCreateCategory("Điện Thoại", "phone", "Điện thoại thông minh Smartphone", null, 2));
        map.put("tablet", getOrCreateCategory("Máy Tính Bảng", "tablet", "Máy tính bảng Tablet giải trí và làm việc", null, 3));
        map.put("accessories", getOrCreateCategory("Phụ Kiện", "accessories", "Phụ kiện công nghệ cao cấp", null, 4));

        return map;
    }

    private Category getOrCreateCategory(String name, String slug, String description, String parentId, int sortOrder) {
        return categoryRepository.findBySlug(slug).orElseGet(() -> {
            Category cat = new Category(name, slug, description, parentId, sortOrder, true);
            cat.setCreatedAt(Instant.now());
            cat.setUpdatedAt(Instant.now());
            return categoryRepository.save(cat);
        });
    }

    private Map<String, Brand> seedBrands() {
        Map<String, Brand> map = new HashMap<>();
        map.put("Dell", getOrCreateBrand("Dell", "dell", "Thương hiệu máy tính cao cấp từ Mỹ", "https://cdn.example.com/brands/dell.png", "https://www.dell.com"));
        map.put("Apple", getOrCreateBrand("Apple", "apple", "Tập đoàn công nghệ Apple danh tiếng", "https://cdn.example.com/brands/apple.png", "https://www.apple.com"));
        map.put("Asus", getOrCreateBrand("Asus", "asus", "Thương hiệu laptop gaming và đồ họa hàng đầu", "https://cdn.example.com/brands/asus.png", "https://www.asus.com"));
        map.put("Lenovo", getOrCreateBrand("Lenovo", "lenovo", "Dòng máy tính ThinkPad và Legion bền bỉ", "https://cdn.example.com/brands/lenovo.png", "https://www.lenovo.com"));
        map.put("HP", getOrCreateBrand("HP", "hp", "Thương hiệu máy tính HP cá nhân và doanh nghiệp", "https://cdn.example.com/brands/hp.png", "https://www.hp.com"));
        map.put("Acer", getOrCreateBrand("Acer", "acer", "Dòng laptop Predator và Nitro tối ưu hiệu năng", "https://cdn.example.com/brands/acer.png", "https://www.acer.com"));
        map.put("MSI", getOrCreateBrand("MSI", "msi", "Chuyên gia phần cứng gaming và đồ họa chuyên nghiệp", "https://cdn.example.com/brands/msi.png", "https://www.msi.com"));
        return map;
    }

    private Brand getOrCreateBrand(String name, String slug, String description, String logoUrl, String website) {
        return brandRepository.findBySlug(slug).orElseGet(() -> {
            Brand b = new Brand(name, slug, description, logoUrl, website, true);
            b.setCreatedAt(Instant.now());
            b.setUpdatedAt(Instant.now());
            return brandRepository.save(b);
        });
    }

    private void seedLaptopProducts(Map<String, Category> categories, Map<String, Brand> brands) {
        Category laptopRoot = categories.get("laptop");
        Category laptopGaming = categories.get("laptop-gaming");
        Category laptopOffice = categories.get("laptop-van-phong");

        List<Product> products = new ArrayList<>();

        // 1. Dell XPS 16 9640
        products.add(createLaptop(
                "DELL-XPS-9640-01",
                "Laptop Dell XPS 16 9640 OLED Intel Core Ultra 7",
                "laptop-dell-xps-16-9640-oled-intel-ultra-7",
                laptopOffice, brands.get("Dell"),
                new BigDecimal("69990000"), new BigDecimal("62990000"),
                30,
                "Laptop cao cấp màn hình 16.3 inch 3.2K OLED 120Hz, Intel Core Ultra 7 155H, RTX 4060",
                "Dell XPS 16 9640 đem đến chuẩn mực mới cho dòng laptop sáng tạo cao cấp với kính vô cực và bàn phím cảm ứng ẩn.",
                List.of("dell", "xps", "oled", "ultra7", "rtx4060"),
                buildSpecs("Intel Core Ultra 7 155H", 16, 4.8, "NVIDIA GeForce RTX 4060", 8, 32, "LPDDR5X", 1024, "SSD NVMe Gen4", 16.3, "3.2K (3200 x 2000) OLED", 120, 99.5, 2.13, List.of("CREATIVE_DESIGN", "DATA_AI", "OFFICE"))
        ));

        // 2. Dell XPS 13 9340
        products.add(createLaptop(
                "DELL-XPS-9340-02",
                "Laptop Dell XPS 13 9340 Intel Core Ultra 7",
                "laptop-dell-xps-13-9340-intel-ultra-7",
                laptopOffice, brands.get("Dell"),
                new BigDecimal("46990000"), new BigDecimal("42990000"),
                25,
                "Laptop siêu mỏng nhẹ 1.19kg, Intel Core Ultra 7 155H, màn hình 13.4 inch FHD+ 120Hz",
                "Dell XPS 13 9340 với thiết kế nhôm nguyên khối siêu mỏng, thời lượng pin cả ngày dài phù hợp doanh nhân.",
                List.of("dell", "xps13", "mongnhe", "ultra7"),
                buildSpecs("Intel Core Ultra 7 155H", 16, 4.8, "Intel Arc Graphics", 0, 16, "LPDDR5X", 512, "SSD NVMe Gen4", 13.4, "FHD+ (1920 x 1200)", 120, 55.0, 1.19, List.of("OFFICE", "THIN_LIGHT", "STUDENT"))
        ));

        // 3. Dell Inspiron 14 5440
        products.add(createLaptop(
                "DELL-INSP-5440-03",
                "Laptop Dell Inspiron 14 5440 Intel Core i5-1335U",
                "laptop-dell-inspiron-14-5440-i5-1335u",
                laptopOffice, brands.get("Dell"),
                new BigDecimal("20990000"), new BigDecimal("18990000"),
                45,
                "Laptop học tập làm việc bền bỉ, Intel Core i5-1335U, RAM 16GB, 512GB SSD",
                "Dell Inspiron 14 5440 vỏ nhôm thanh lịch, cấu hình ổn định cho dân văn phòng và sinh viên.",
                List.of("dell", "inspiron", "vanphong", "sinhvien"),
                buildSpecs("Intel Core i5-1335U", 10, 4.6, "Intel Iris Xe Graphics", 0, 16, "DDR5", 512, "SSD NVMe", 14.0, "FHD+ (1920 x 1200)", 60, 54.0, 1.54, List.of("OFFICE", "STUDENT"))
        ));

        // 4. Dell Alienware m16 R2
        products.add(createLaptop(
                "DELL-ALW-M16R2-04",
                "Laptop Gaming Dell Alienware m16 R2 RTX 4070",
                "laptop-gaming-dell-alienware-m16-r2-rtx-4070",
                laptopGaming, brands.get("Dell"),
                new BigDecimal("62990000"), new BigDecimal("56990000"),
                18,
                "Quái vật gaming Alienware m16 R2, Intel Core Ultra 7 155H, RTX 4070 8GB, màn hình 240Hz",
                "Alienware m16 R2 tản nhiệt buồng hơi Cryo-Tech đột phá, thiết kế đậm chất phi thuyền không gian.",
                List.of("dell", "alienware", "gaming", "rtx4070", "240hz"),
                buildSpecs("Intel Core Ultra 7 155H", 16, 4.8, "NVIDIA GeForce RTX 4070", 8, 32, "DDR5", 1024, "SSD NVMe Gen4", 16.0, "QHD+ (2560 x 1600)", 240, 90.0, 2.61, List.of("GAMING", "CREATIVE_DESIGN"))
        ));

        // 5. Apple MacBook Pro 14 M3 Pro
        products.add(createLaptop(
                "APL-MBP-14-M3P-05",
                "Apple MacBook Pro 14 inch M3 Pro 18GB 512GB",
                "apple-macbook-pro-14-inch-m3-pro-18gb-512gb",
                laptopOffice, brands.get("Apple"),
                new BigDecimal("53990000"), new BigDecimal("49990000"),
                35,
                "MacBook Pro 14 chip Apple M3 Pro 11-core CPU, 14-core GPU, màn hình Liquid Retina XDR",
                "Hiệu năng đột phá với kiến trúc Apple Silicon 3nm, pin lên tới 18 tiếng liên tục.",
                List.of("apple", "macbook", "m3pro", "retinaxdr"),
                buildSpecs("Apple M3 Pro (11-core)", 11, 4.05, "Apple M3 Pro (14-core GPU)", 0, 18, "Unified Memory", 512, "Apple SSD", 14.2, "Liquid Retina XDR (3024 x 1964)", 120, 70.0, 1.61, List.of("CREATIVE_DESIGN", "OFFICE", "THIN_LIGHT"))
        ));

        // 6. Apple MacBook Pro 16 M3 Max
        products.add(createLaptop(
                "APL-MBP-16-M3M-06",
                "Apple MacBook Pro 16 inch M3 Max 48GB 1TB",
                "apple-macbook-pro-16-inch-m3-max-48gb-1tb",
                laptopOffice, brands.get("Apple"),
                new BigDecimal("95990000"), new BigDecimal("89990000"),
                12,
                "Trạm làm việc di động tối thượng Apple M3 Max 16-core CPU, 40-core GPU, 48GB RAM",
                "Sức mạnh vô song cho các nhà khoa học dữ liệu, lập trình viên AI và biên tập video 8K.",
                List.of("apple", "macbook", "m3max", "data-ai"),
                buildSpecs("Apple M3 Max (16-core)", 16, 4.05, "Apple M3 Max (40-core GPU)", 0, 48, "Unified Memory", 1024, "Apple SSD", 16.2, "Liquid Retina XDR (3456 x 2234)", 120, 100.0, 2.16, List.of("DATA_AI", "CREATIVE_DESIGN"))
        ));

        // 7. Apple MacBook Air 13 M3
        products.add(createLaptop(
                "APL-MBA-13-M3-07",
                "Apple MacBook Air 13 inch M3 16GB 512GB",
                "apple-macbook-air-13-inch-m3-16gb-512gb",
                laptopOffice, brands.get("Apple"),
                new BigDecimal("35990000"), new BigDecimal("32990000"),
                50,
                "MacBook Air 13 mỏng 11.3mm, chip Apple M3, pin 18 giờ, không quạt hoàn toàn êm ái",
                "Chiếc máy tính xách tay phổ biến nhất thế giới nay mạnh mẽ hơn với chip M3.",
                List.of("apple", "macbookair", "m3", "mongnhe"),
                buildSpecs("Apple M3 (8-core)", 8, 4.05, "Apple M3 (10-core GPU)", 0, 16, "Unified Memory", 512, "Apple SSD", 13.6, "Liquid Retina (2560 x 1664)", 60, 52.6, 1.24, List.of("THIN_LIGHT", "STUDENT", "OFFICE"))
        ));

        // 8. Apple MacBook Air 15 M3
        products.add(createLaptop(
                "APL-MBA-15-M3-08",
                "Apple MacBook Air 15 inch M3 16GB 512GB",
                "apple-macbook-air-15-inch-m3-16gb-512gb",
                laptopOffice, brands.get("Apple"),
                new BigDecimal("40990000"), new BigDecimal("37990000"),
                40,
                "Màn hình lớn 15.3 inch trong thân máy siêu mỏng nhẹ, chip Apple M3 mạnh mẽ",
                "Không gian hiển thị rộng rãi cùng hệ thống 6 loa âm thanh không gian sống động.",
                List.of("apple", "macbookair15", "m3"),
                buildSpecs("Apple M3 (8-core)", 8, 4.05, "Apple M3 (10-core GPU)", 0, 16, "Unified Memory", 512, "Apple SSD", 15.3, "Liquid Retina (2880 x 1864)", 60, 66.5, 1.51, List.of("THIN_LIGHT", "OFFICE"))
        ));

        // 9. Asus ROG Zephyrus G16
        products.add(createLaptop(
                "ASUS-ROG-G16-09",
                "Laptop Gaming Asus ROG Zephyrus G16 OLED RTX 4080",
                "laptop-gaming-asus-rog-zephyrus-g16-oled-rtx-4080",
                laptopGaming, brands.get("Asus"),
                new BigDecimal("74990000"), new BigDecimal("69990000"),
                15,
                "Tuyệt tác laptop gaming mỏng nhẹ, màn hình 2.5K OLED 240Hz, RTX 4080 12GB",
                "Khung nhôm CNC chuẩn hàng không vũ trụ cùng dải đèn Slash Lighting độc bản.",
                List.of("asus", "rog", "zephyrus", "g16", "oled240hz"),
                buildSpecs("Intel Core Ultra 9 185H", 16, 5.1, "NVIDIA GeForce RTX 4080", 12, 32, "LPDDR5X", 1024, "SSD NVMe Gen4", 16.0, "2.5K (2560 x 1600) OLED", 240, 90.0, 1.85, List.of("GAMING", "CREATIVE_DESIGN", "THIN_LIGHT"))
        ));

        // 10. Asus ROG Strix SCAR 16
        products.add(createLaptop(
                "ASUS-SCAR-16-10",
                "Laptop Gaming Asus ROG Strix SCAR 16 RTX 4090",
                "laptop-gaming-asus-rog-strix-scar-16-rtx-4090",
                laptopGaming, brands.get("Asus"),
                new BigDecimal("91990000"), new BigDecimal("84990000"),
                10,
                "Đỉnh cao sức mạnh esport, Intel Core i9-14900HX, RTX 4090 16GB, Mini LED 240Hz",
                "Hệ thống tản nhiệt 3 quạt kim loại lỏng Conductonaut Extreme tối đa hóa hiệu năng.",
                List.of("asus", "rog", "strix", "scar16", "rtx4090"),
                buildSpecs("Intel Core i9-14900HX", 24, 5.8, "NVIDIA GeForce RTX 4090", 16, 32, "DDR5", 2048, "SSD NVMe Gen4", 16.0, "QHD+ Mini LED (2560 x 1600)", 240, 90.0, 2.65, List.of("GAMING", "DATA_AI"))
        ));

        // 11. Asus Zenbook 14 OLED UX3405
        products.add(createLaptop(
                "ASUS-ZEN-14-11",
                "Laptop Asus Zenbook 14 OLED UX3405 Intel Core Ultra 7",
                "laptop-asus-zenbook-14-oled-ux3405-ultra-7",
                laptopOffice, brands.get("Asus"),
                new BigDecimal("34990000"), new BigDecimal("31990000"),
                30,
                "Laptop mỏng nhẹ 1.2kg, màn hình 3K OLED 120Hz sắc nét, pin 75Wh siêu trâu",
                "Zenbook 14 OLED tích hợp vi xử lý AI NPU thế hệ mới hỗ trợ tác vụ AI offline mượt mà.",
                List.of("asus", "zenbook", "oled3k", "ultra7"),
                buildSpecs("Intel Core Ultra 7 155H", 16, 4.8, "Intel Arc Graphics", 0, 32, "LPDDR5X", 1024, "SSD NVMe Gen4", 14.0, "3K (2880 x 1800) OLED", 120, 75.0, 1.20, List.of("THIN_LIGHT", "OFFICE", "STUDENT"))
        ));

        // 12. Asus TUF Gaming A15
        products.add(createLaptop(
                "ASUS-TUF-A15-12",
                "Laptop Gaming Asus TUF Gaming A15 AMD Ryzen 7 RTX 4060",
                "laptop-gaming-asus-tuf-gaming-a15-r7-rtx-4060",
                laptopGaming, brands.get("Asus"),
                new BigDecimal("27990000"), new BigDecimal("25490000"),
                35,
                "Laptop gaming quốc dân, AMD Ryzen 7 7735HS, RTX 4060 8GB 140W, độ bền quân đội",
                "Khả năng nâng cấp ram và ổ cứng linh hoạt, bàn phím RGB 1 vùng chống bám vân tay.",
                List.of("asus", "tuf", "gaming", "rtx4060", "ryzen7"),
                buildSpecs("AMD Ryzen 7 7735HS", 8, 4.75, "NVIDIA GeForce RTX 4060", 8, 16, "DDR5", 512, "SSD NVMe", 15.6, "FHD (1920 x 1080) IPS", 144, 90.0, 2.20, List.of("GAMING", "STUDENT"))
        ));

        // 13. Lenovo ThinkPad X1 Carbon Gen 12
        products.add(createLaptop(
                "LNV-TP-X1C12-13",
                "Laptop Lenovo ThinkPad X1 Carbon Gen 12 Intel Core Ultra 7",
                "laptop-lenovo-thinkpad-x1-carbon-gen-12-ultra-7",
                laptopOffice, brands.get("Lenovo"),
                new BigDecimal("64990000"), new BigDecimal("58990000"),
                20,
                "Biểu tượng laptop doanh nhân bền bỉ, sợi carbon siêu nhẹ 1.09kg, màn 2.8K OLED",
                "Bàn phím ThinkPad trứ danh với nút TrackPoint đỏ và cơ chế bảo mật vân tay kết hợp camera IR.",
                List.of("lenovo", "thinkpad", "x1carbon", "doanhnhan"),
                buildSpecs("Intel Core Ultra 7 155H", 16, 4.8, "Intel Arc Graphics", 0, 32, "LPDDR5X", 1024, "SSD NVMe Gen4", 14.0, "2.8K (2880 x 1800) OLED", 120, 57.0, 1.09, List.of("OFFICE", "THIN_LIGHT"))
        ));

        // 14. Lenovo Legion 7i Gen 9
        products.add(createLaptop(
                "LNV-LEGION-7I-14",
                "Laptop Gaming Lenovo Legion 7i Gen 9 RTX 4070",
                "laptop-gaming-lenovo-legion-7i-gen-9-rtx-4070",
                laptopGaming, brands.get("Lenovo"),
                new BigDecimal("57990000"), new BigDecimal("52990000"),
                18,
                "Laptop gaming nhôm nguyên khối Glacier White, Intel i9-14900HX, RTX 4070 8GB",
                "Màn hình 3.2K 165Hz chuẩn màu 100% DCI-P3 phục vụ cả chơi game đỉnh cao và dựng phim.",
                List.of("lenovo", "legion", "legion7i", "rtx4070", "gaming"),
                buildSpecs("Intel Core i9-14900HX", 24, 5.8, "NVIDIA GeForce RTX 4070", 8, 32, "DDR5", 1024, "SSD NVMe Gen4", 16.0, "3.2K (3200 x 2000) IPS", 165, 99.9, 2.24, List.of("GAMING", "CREATIVE_DESIGN"))
        ));

        // 15. Lenovo LOQ 15IAX9
        products.add(createLaptop(
                "LNV-LOQ-15-15",
                "Laptop Gaming Lenovo LOQ 15IAX9 RTX 3050",
                "laptop-gaming-lenovo-loq-15iax9-rtx-3050",
                laptopGaming, brands.get("Lenovo"),
                new BigDecimal("19990000"), new BigDecimal("17990000"),
                40,
                "Laptop gaming giá tốt cho sinh viên, Intel Core i5-12450HX, RTX 3050 6GB 144Hz",
                "Thiết kế tản nhiệt buồng kín Hyperchamber thổi gió ra sau, không phả vào tay game thủ.",
                List.of("lenovo", "loq", "gaminggiare", "sinhvien"),
                buildSpecs("Intel Core i5-12450HX", 8, 4.4, "NVIDIA GeForce RTX 3050", 6, 16, "DDR5", 512, "SSD NVMe", 15.6, "FHD (1920 x 1080) IPS", 144, 60.0, 2.38, List.of("GAMING", "STUDENT"))
        ));

        // 16. Lenovo IdeaPad Slim 3 14
        products.add(createLaptop(
                "LNV-IP3-14-16",
                "Laptop Lenovo IdeaPad Slim 3 14 AMD Ryzen 5",
                "laptop-lenovo-ideapad-slim-3-14-ryzen-5",
                laptopOffice, brands.get("Lenovo"),
                new BigDecimal("14990000"), new BigDecimal("13490000"),
                50,
                "Laptop sinh viên mỏng nhẹ giá hạt dẻ, AMD Ryzen 5 7530U, RAM 16GB, SSD 512GB",
                "Độ bền đạt chuẩn quân sự MIL-STD-810H cùng cảm biến vân tay 1 chạm tiện lợi.",
                List.of("lenovo", "ideapad", "sinhvien", "giare"),
                buildSpecs("AMD Ryzen 5 7530U", 6, 4.5, "AMD Radeon Graphics", 0, 16, "DDR4", 512, "SSD NVMe", 14.0, "FHD (1920 x 1080) IPS", 60, 47.0, 1.37, List.of("STUDENT", "OFFICE"))
        ));

        // 17. HP Omen Transcend 14
        products.add(createLaptop(
                "HP-OMEN-14-17",
                "Laptop Gaming HP Omen Transcend 14 OLED RTX 4060",
                "laptop-gaming-hp-omen-transcend-14-oled-rtx-4060",
                laptopGaming, brands.get("HP"),
                new BigDecimal("49990000"), new BigDecimal("44990000"),
                22,
                "Laptop gaming 14 inch mỏng nhẹ nhất của HP, Intel Core Ultra 7 155H, màn 2.8K OLED",
                "Bàn phím RGB pudding không viền độc đáo kết hợp tản nhiệt buồng hơi Intel Hyperbaric.",
                List.of("hp", "omen", "gaming14", "oled", "ultra7"),
                buildSpecs("Intel Core Ultra 7 155H", 16, 4.8, "NVIDIA GeForce RTX 4060", 8, 16, "LPDDR5X", 1024, "SSD NVMe Gen4", 14.0, "2.8K (2880 x 1800) OLED", 120, 71.0, 1.63, List.of("GAMING", "THIN_LIGHT", "CREATIVE_DESIGN"))
        ));

        // 18. HP Pavilion 14
        products.add(createLaptop(
                "HP-PAV-14-18",
                "Laptop HP Pavilion 14 Intel Core i5-1335U",
                "laptop-hp-pavilion-14-i5-1335u",
                laptopOffice, brands.get("HP"),
                new BigDecimal("18490000"), new BigDecimal("16990000"),
                45,
                "Laptop văn phòng thanh lịch, Intel Core i5-1335U, RAM 16GB, âm thanh B&O cao cấp",
                "Vỏ nhôm màu bạc sang trọng, sạc nhanh 50% trong 30 phút phục vụ làm việc linh hoạt.",
                List.of("hp", "pavilion", "vanphong", "b&o"),
                buildSpecs("Intel Core i5-1335U", 10, 4.6, "Intel Iris Xe Graphics", 0, 16, "DDR4", 512, "SSD NVMe", 14.0, "FHD (1920 x 1080) IPS", 60, 43.0, 1.41, List.of("STUDENT", "OFFICE"))
        ));

        // 19. Acer Predator Helios 16
        products.add(createLaptop(
                "ACER-PRED-16-19",
                "Laptop Gaming Acer Predator Helios 16 RTX 4070",
                "laptop-gaming-acer-predator-helios-16-rtx-4070",
                laptopGaming, brands.get("Acer"),
                new BigDecimal("51990000"), new BigDecimal("46990000"),
                16,
                "Chiến binh gaming Predator Helios 16, Intel Core i7-14700HX, RTX 4070 140W, màn 240Hz",
                "Quạt kim loại 3D AeroBlade thế hệ thứ 5 cùng khe tản nhiệt phía sau có nắp che thay thế được.",
                List.of("acer", "predator", "helios", "rtx4070", "gaming"),
                buildSpecs("Intel Core i7-14700HX", 20, 5.5, "NVIDIA GeForce RTX 4070", 8, 16, "DDR5", 1024, "SSD NVMe Gen4", 16.0, "WQXGA (2560 x 1600) IPS", 240, 90.0, 2.60, List.of("GAMING", "DATA_AI"))
        ));

        // 20. MSI Stealth 16 AI Studio
        products.add(createLaptop(
                "MSI-STEALTH-16-20",
                "Laptop MSI Stealth 16 AI Studio OLED RTX 4070",
                "laptop-msi-stealth-16-ai-studio-oled-rtx-4070",
                laptopGaming, brands.get("MSI"),
                new BigDecimal("70990000"), new BigDecimal("64990000"),
                14,
                "Laptop studio đồ họa và gaming siêu mỏng hợp kim Magie-Nhôm, Intel Core Ultra 9 185H",
                "Chuẩn NVIDIA Studio dành riêng cho nhà sáng tạo nội dung, hệ thống 6 loa vòm Dynaudio.",
                List.of("msi", "stealth", "studio", "oled240hz", "ultra9"),
                buildSpecs("Intel Core Ultra 9 185H", 16, 5.1, "NVIDIA GeForce RTX 4070", 8, 32, "DDR5", 1024, "SSD NVMe Gen4", 16.0, "QHD+ (2560 x 1600) OLED", 240, 99.9, 1.99, List.of("CREATIVE_DESIGN", "GAMING", "DATA_AI"))
        ));

        // Insert only if not existing
        int insertedCount = 0;
        for (Product p : products) {
            if (!productRepository.existsBySku(p.getSku())) {
                productRepository.save(p);
                insertedCount++;
            }
        }
        log.info("Đã kiểm tra 20 sản phẩm laptop mẫu: chèn mới {} sản phẩm.", insertedCount);
    }

    private Product createLaptop(String sku, String name, String slug,
                                 Category category, Brand brand,
                                 BigDecimal listPrice, BigDecimal salePrice,
                                 int stockQty, String shortDesc, String fullDesc,
                                 List<String> tags, Map<String, Object> specs) {
        Product p = new Product();
        p.setSku(sku);
        p.setName(name);
        p.setSlug(slug);
        p.setCategoryId(category.getId());
        p.setCategorySlug(category.getSlug().toLowerCase());
        p.setBrandId(brand.getId());
        p.setBrandName(brand.getName());
        p.setListPrice(listPrice);
        p.setSalePrice(salePrice);
        p.setCurrency("VND");
        p.setInventory(new Inventory(stockQty, 0));
        p.setStatus("ACTIVE");
        p.setThumbnailUrl("https://cdn.example.com/products/" + slug + "-thumb.jpg");
        p.setImages(List.of(
                "https://cdn.example.com/products/" + slug + "-1.jpg",
                "https://cdn.example.com/products/" + slug + "-2.jpg"
        ));
        p.setShortDescription(shortDesc);
        p.setDescription(fullDesc);
        p.setTags(tags);
        p.setAttributes(specs);
        p.setRatingSummary(new RatingSummary(4.8, 12));
        p.setIsSynthetic(true);
        p.setDataOrigin("SYNTHETIC");
        p.setCreatedAt(Instant.now());
        p.setUpdatedAt(Instant.now());
        p.recalculateInStock();
        return p;
    }

    private Map<String, Object> buildSpecs(
            String cpuModel, int cpuCores, double cpuBoost,
            String gpuModel, int vramGb,
            int ramGb, String ramType,
            int storageGb, String storageType,
            double displayInches, String resolution, int refreshRate,
            double batteryWh, double weightKg,
            List<String> useCases
    ) {
        Map<String, Object> specs = new HashMap<>();

        Map<String, Object> cpu = new HashMap<>();
        cpu.put("model", cpuModel);
        cpu.put("cores", cpuCores);
        cpu.put("boostClockGhz", cpuBoost);
        specs.put("cpu", cpu);

        Map<String, Object> gpu = new HashMap<>();
        gpu.put("model", gpuModel);
        gpu.put("vramGb", vramGb);
        specs.put("gpu", gpu);

        Map<String, Object> ram = new HashMap<>();
        ram.put("capacityGb", ramGb);
        ram.put("ramType", ramType);
        specs.put("ram", ram);

        Map<String, Object> storage = new HashMap<>();
        storage.put("capacityGb", storageGb);
        storage.put("storageType", storageType);
        specs.put("storage", storage);

        Map<String, Object> display = new HashMap<>();
        display.put("sizeInches", displayInches);
        display.put("resolution", resolution);
        display.put("refreshRateHz", refreshRate);
        specs.put("display", display);

        Map<String, Object> battery = new HashMap<>();
        battery.put("capacityWh", batteryWh);
        specs.put("battery", battery);

        Map<String, Object> physical = new HashMap<>();
        physical.put("weightKg", weightKg);
        specs.put("physical", physical);

        specs.put("useCases", useCases);

        return specs;
    }
}

