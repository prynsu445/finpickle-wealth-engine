package com.finpickle.finpickleProject.service;

import com.finpickle.finpickleProject.entity.Account;
import com.finpickle.finpickleProject.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j // Automated logging system
public class MicroInvestmentScheduler {
    private final AccountRepository accountRepository;

    // Har 30 seconds me auto run hoga local testing ke liye
    @Scheduled(fixedRate = 30000)
    @Transactional
    public void executeMicroInvestments() {
        log.info("🤖 Micro-Investment Engine Triggered: Scanning accounts for spare change...");

        List<Account> accounts = accountRepository.findAll();

        for (Account account : accounts) {
            BigDecimal spareChange = account.getSpareChangePiggyBank();

            if (spareChange != null && spareChange.compareTo(BigDecimal.ZERO) > 0) {
                log.info("💸 [INVESTMENT SIMULATION] Account ID: {} | Investing Spare Change: ₹{} into Mutual Funds Layer.",
                        account.getId(), spareChange);

                // Clear the piggy bank post simulation execution
                account.setSpareChangePiggyBank(BigDecimal.ZERO);
                accountRepository.save(account);
            }
        }
    }
}