package edu.ntu.pms.user.repository;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import edu.ntu.pms.user.entity.Department;

@DataJpaTest
@ActiveProfiles("test")
class DepartmentRepositoryTest {

    @Autowired
    private TestEntityManager em;

    @Autowired
    private DepartmentRepository repo;

    @Test
    void saveAndFind() {
        Department dept = Department.builder().name("HR").build();
        Department saved = repo.save(dept);
        
        Department found = em.find(Department.class, saved.getId());
        assertThat(found.getName()).isEqualTo("HR");
    }
}
