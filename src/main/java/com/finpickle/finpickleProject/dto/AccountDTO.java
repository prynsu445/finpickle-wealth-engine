package com.finpickle.finpickleProject.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record AccountDTO(
        Long id,
        @NotNull(message = "User ID cannot be null") Long userId,
        @NotBlank(message = "Account number cannot be blank") String accountNumber,
        BigDecimal mainBalance,
        BigDecimal spareChangePiggyBank
) {}