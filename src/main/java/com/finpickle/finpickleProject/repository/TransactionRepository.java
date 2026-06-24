package com.finpickle.finpickleProject.repository;



import com.finpickle.finpickleProject.entity.Transaction;

import com.finpickle.finpickleProject.entity.TransactionType;

import org.springframework.data.domain.Page;

import org.springframework.data.domain.Pageable;

import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.stereotype.Repository;



@Repository

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    // Dynamic Pagination + Search criteria mapping using JPA Magic

    Page<Transaction> findByType(TransactionType type, Pageable pageable);

}