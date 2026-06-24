package com.finpickle.finpickleProject.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TransactionDTO(
        Long id,
        @NotNull(message = "Account ID cannot be null") Long accountId,
        @NotNull(message = "Transaction amount cannot be null") BigDecimal amount,
        @NotBlank(message = "Transaction type cannot be blank") String type, // CREDIT / DEBIT
        LocalDateTime timestamp
) {}