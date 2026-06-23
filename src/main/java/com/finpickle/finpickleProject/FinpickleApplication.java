package com.finpickle.finpickleProject;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FinpickleApplication {

	public static void main(String[] args) {
		SpringApplication.run(FinpickleApplication.class, args);
	}

}
