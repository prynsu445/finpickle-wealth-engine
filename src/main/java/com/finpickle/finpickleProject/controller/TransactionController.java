package com.finpickle.finpickleProject.controller;

import com.finpickle.finpickleProject.dto.TransactionDTO;
import com.finpickle.finpickleProject.entity.Transaction;
import com.finpickle.finpickleProject.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class TransactionController {
    private final TransactionService transactionService;

    @PostMapping
    public ResponseEntity<TransactionDTO> executeTransaction(@RequestBody TransactionDTO dto) {
        return ResponseEntity.ok(transactionService.processTransaction(dto));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<Transaction>> search(
            @RequestParam String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(transactionService.searchTransactions(type, pageable));
    }
}