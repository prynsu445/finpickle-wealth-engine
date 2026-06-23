package com.finpickle.finpickleProject.service;

import com.finpickle.finpickleProject.dto.AccountDTO;
import com.finpickle.finpickleProject.entity.Account;
import com.finpickle.finpickleProject.entity.User;
import com.finpickle.finpickleProject.exception.ResourceNotFoundException;
import com.finpickle.finpickleProject.repository.AccountRepository;
import com.finpickle.finpickleProject.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class AccountService {
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    @Transactional
    public AccountDTO createAccount(AccountDTO dto) {
        User user = userRepository.findById(dto.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + dto.userId()));

        Account account = Account.builder()
                .accountNumber(dto.accountNumber())
                .mainBalance(dto.mainBalance() != null ? dto.mainBalance() : BigDecimal.ZERO)
                .spareChangePiggyBank(BigDecimal.ZERO)
                .user(user)
                .build();

        Account saved = accountRepository.save(account);
        return new AccountDTO(saved.getId(), saved.getUser().getId(), saved.getAccountNumber(), saved.getMainBalance(), saved.getSpareChangePiggyBank());
    }
}