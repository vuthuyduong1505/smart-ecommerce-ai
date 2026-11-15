package com.ecommerce.backend.validation;

import com.ecommerce.backend.exception.BadRequestException;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
public class LaptopAttributeValidator {

    private static final Set<String> VALID_USE_CASES = Set.of(
            "GAMING",
            "OFFICE",
            "CREATIVE_DESIGN",
            "DATA_AI",
            "STUDENT",
            "THIN_LIGHT"
    );

    @SuppressWarnings("unchecked")
    public void validate(Map<String, Object> attributes) {
        if (attributes == null || attributes.isEmpty()) {
            throw new BadRequestException("Sản phẩm Laptop bắt buộc phải có thuộc tính kỹ thuật (attributes)");
        }

        // 1. CPU Validation
        Map<String, Object> cpu = getMap(attributes, "cpu", "Thông số CPU (cpu)");
        requireField(cpu, "model", "Tên model CPU (cpu.model)");
        requireField(cpu, "cores", "Số nhân CPU (cpu.cores)");
        requireField(cpu, "boostClockGhz", "Xung nhịp tối đa CPU (cpu.boostClockGhz)");

        // 2. GPU Validation
        Map<String, Object> gpu = getMap(attributes, "gpu", "Thông số GPU (gpu)");
        requireField(gpu, "model", "Tên model GPU (gpu.model)");
        requireField(gpu, "vramGb", "Dung lượng VRAM GPU (gpu.vramGb)");

        // 3. RAM Validation
        Map<String, Object> ram = getMap(attributes, "ram", "Thông số RAM (ram)");
        requireField(ram, "capacityGb", "Dung lượng RAM (ram.capacityGb)");
        requireField(ram, "ramType", "Chuẩn RAM (ram.ramType)");

        // 4. Storage Validation
        Map<String, Object> storage = getMap(attributes, "storage", "Thông số Ổ cứng (storage)");
        requireField(storage, "capacityGb", "Dung lượng Ổ cứng (storage.capacityGb)");
        requireField(storage, "storageType", "Chuẩn Ổ cứng (storage.storageType)");

        // 5. Display Validation
        Map<String, Object> display = getMap(attributes, "display", "Thông số Màn hình (display)");
        requireField(display, "sizeInches", "Kích thước màn hình (display.sizeInches)");
        requireField(display, "resolution", "Độ phân giải màn hình (display.resolution)");
        requireField(display, "refreshRateHz", "Tần số quét màn hình (display.refreshRateHz)");

        // 6. Battery Validation
        Map<String, Object> battery = getMap(attributes, "battery", "Thông số Pin (battery)");
        requireField(battery, "capacityWh", "Dung lượng Pin (battery.capacityWh)");

        // 7. Physical Validation
        Map<String, Object> physical = getMap(attributes, "physical", "Thông số Kích thước/Trọng lượng (physical)");
        requireField(physical, "weightKg", "Trọng lượng máy (physical.weightKg)");

        // 8. useCases Validation
        Object useCasesObj = attributes.get("useCases");
        if (!(useCasesObj instanceof List<?> list) || list.isEmpty()) {
            throw new BadRequestException("Nhu cầu sử dụng (useCases) phải là danh sách chứa ít nhất một mục hợp lệ");
        }
        for (Object item : list) {
            if (item == null || !VALID_USE_CASES.contains(item.toString().toUpperCase())) {
                throw new BadRequestException("Nhu cầu sử dụng không hợp lệ: " + item + ". Các giá trị hợp lệ: " + VALID_USE_CASES);
            }
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> getMap(Map<String, Object> parent, String key, String fieldName) {
        Object val = parent.get(key);
        if (!(val instanceof Map)) {
            throw new BadRequestException(fieldName + " phải là một đối tượng chứa các thuộc tính con");
        }
        return (Map<String, Object>) val;
    }

    private void requireField(Map<String, Object> map, String key, String fieldName) {
        Object val = map.get(key);
        if (val == null || (val instanceof String str && str.trim().isEmpty())) {
            throw new BadRequestException("Thiếu thuộc tính bắt buộc: " + fieldName);
        }
    }
}

