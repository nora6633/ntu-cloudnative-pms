package edu.ntu.pms.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import edu.ntu.pms.user.Role;
import edu.ntu.pms.user.User;
import edu.ntu.pms.user.UserRepository;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seedUsers(UserRepository repo, PasswordEncoder encoder) {
        return args -> {
            if (repo.findByUsername("admin").isEmpty()) {
                repo.save(User.builder()
                        .username("admin")
                        .passwordHash(encoder.encode("admin123"))
                        .role(Role.ADMIN)
                        .build());
            }
            if (repo.findByUsername("user").isEmpty()) {
                repo.save(User.builder()
                        .username("user")
                        .passwordHash(encoder.encode("user123"))
                        .role(Role.USER)
                        .build());
            }
        };
    }
}
