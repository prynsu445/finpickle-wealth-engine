package com.finpickle.finpickleProject.service;

import com.finpickle.finpickleProject.dto.TransactionDTO;
import com.finpickle.finpickleProject.entity.Account;
import com.finpickle.finpickleProject.entity.Transaction;
import com.finpickle.finpickleProject.entity.TransactionType;
import com.finpickle.finpickleProject.exception.InsufficientBalanceException;
import com.finpickle.finpickleProject.exception.ResourceNotFoundException;
import com.finpickle.finpickleProject.repository.AccountRepository;
import com.finpickle.finpickleProject.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class TransactionService {
    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;

    @Transactional
    public TransactionDTO processTransaction(TransactionDTO dto) {
        Account account = accountRepository.findById(dto.accountId())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

        BigDecimal amount = dto.amount();
        TransactionType targetType = TransactionType.valueOf(dto.type().toUpperCase());

        if (targetType == TransactionType.CREDIT) {
            account.setMainBalance(account.getMainBalance().add(amount));
        } else if (targetType == TransactionType.DEBIT) {
            // Enterprise Micro-Investment Specification:
            // Calculate total deduction including spare change up to the nearest multiple of 50
            BigDecimal nearestMultiple = new BigDecimal("50");
            BigDecimal remainder = amount.remainder(nearestMultiple);
            BigDecimal roundUpAmount = remainder.compareTo(BigDecimal.ZERO) == 0 ? amount : amount.add(nearestMultiple.subtract(remainder));
            BigDecimal spareChange = roundUpAmount.subtract(amount);

            // Total amount to check funds against
            if (account.getMainBalance().compareTo(roundUpAmount) < 0) {
                throw new InsufficientBalanceException("Insufficient funds! Transaction requires balance for purchase + round-up: " + roundUpAmount);
            }

            // Deduct original amount from Main, push spare change to Piggy Bank
            account.setMainBalance(account.getMainBalance().subtract(amount).subtract(spareChange));
            account.setSpareChangePiggyBank(account.getSpareChangePiggyBank().add(spareChange));
        }

        accountRepository.save(account);

        Transaction txn = Transaction.builder()
                .amount(amount)
                .type(targetType)
                .timestamp(LocalDateTime.now())
                .account(account)
                .build();

        Transaction saved = transactionRepository.save(txn);
        return new TransactionDTO(saved.getId(), saved.getAccount().getId(), saved.getAmount(), saved.getType().name(), saved.getTimestamp());
    }

    @Transactional(readOnly = true)
    public Page<Transaction> searchTransactions(String type, Pageable pageable) {
        return transactionRepository.findByType(TransactionType.valueOf(type.toUpperCase()), pageable);
    }
}