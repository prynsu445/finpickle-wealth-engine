package com.finpickle.finpickleProject.service;

import com.finpickle.finpickleProject.dto.UserDTO;
import com.finpickle.finpickleProject.entity.User;
import com.finpickle.finpickleProject.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor // Constructor injection using Lombok final fields
public class UserService {
    private final UserRepository userRepository;

    @Transactional
    public UserDTO createUser(UserDTO dto) {
        User user = User.builder().name(dto.name()).email(dto.email()).build();
        User saved = userRepository.save(user);
        return new UserDTO(saved.getId(), saved.getName(), saved.getEmail());
    }
}