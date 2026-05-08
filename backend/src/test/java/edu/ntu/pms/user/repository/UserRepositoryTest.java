package edu.ntu.pms.user.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;

import edu.ntu.pms.user.entity.Department;
import edu.ntu.pms.user.entity.Job;
import edu.ntu.pms.user.entity.User;
import edu.ntu.pms.user.enums.Role;

@DataJpaTest
class UserRepositoryTest {

    @Autowired
    private TestEntityManager em;

    @Autowired
    private UserRepository repo;

    @Test
    void findByUsername_returnsUser() {
        Job job = Job.builder().title("Dev").build();
        em.persist(job);
        Department dept = Department.builder().name("Eng").build();
        em.persist(dept);

        User user = User.builder()
                .username("testuser")
                .passwordHash("hash")
                .role(Role.EMPLOYEE)
                .job(job)
                .department(dept)
                .build();
        em.persist(user);
        em.flush();

        Optional<User> found = repo.findByUsername("testuser");
        assertThat(found).isPresent();
        assertThat(found.get().getUsername()).isEqualTo("testuser");
    }

    @Test
    void findByUsername_nonExistent_returnsEmpty() {
        Optional<User> found = repo.findByUsername("none");
        assertThat(found).isEmpty();
    }
}
