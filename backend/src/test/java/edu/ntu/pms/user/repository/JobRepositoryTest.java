package edu.ntu.pms.user.repository;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import edu.ntu.pms.user.entity.Job;

@DataJpaTest
@ActiveProfiles("test")
class JobRepositoryTest {

    @Autowired
    private TestEntityManager em;

    @Autowired
    private JobRepository repo;

    @Test
    void saveAndFind() {
        Job job = Job.builder().title("Engineer").build();
        Job saved = repo.save(job);
        
        Job found = em.find(Job.class, saved.getId());
        assertThat(found.getTitle()).isEqualTo("Engineer");
    }
}
