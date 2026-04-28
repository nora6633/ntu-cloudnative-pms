package edu.ntu.pms.seeders;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import edu.ntu.pms.user.Role;
import edu.ntu.pms.user.entity.Department;
import edu.ntu.pms.user.entity.Job;
import edu.ntu.pms.user.entity.User;
import edu.ntu.pms.user.repository.DepartmentRepository;
import edu.ntu.pms.user.repository.JobRepository;
import edu.ntu.pms.user.repository.UserRepository;

@SpringBootTest
@TestPropertySource(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
class DataSeederTest {

    @Autowired
    private DataSeeder dataSeeder;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @BeforeEach
    void setUp() throws Exception {
        // Clear data before each test
        userRepository.deleteAll();
        jobRepository.deleteAll();
        departmentRepository.deleteAll();

        // Run the seeder
        dataSeeder.run();
    }

    @Test
    void shouldCreateJobs() {
        List<Job> jobs = jobRepository.findAll();
        
        assertNotNull(jobs);
        assertEquals(4, jobs.size());
        assertTrue(jobs.stream().anyMatch(j -> j.getTitle().equals(DataSeeder.JOB_JUNIOR_SOFTWARE_ENGINEER)));
        assertTrue(jobs.stream().anyMatch(j -> j.getTitle().equals(DataSeeder.JOB_SENIOR_SOFTWARE_ENGINEER)));
        assertTrue(jobs.stream().anyMatch(j -> j.getTitle().equals(DataSeeder.JOB_JUNIOR_HR)));
        assertTrue(jobs.stream().anyMatch(j -> j.getTitle().equals(DataSeeder.JOB_SENIOR_HR)));
    }

    @Test
    void shouldCreateDepartments() {
        List<Department> departments = departmentRepository.findAll();
        
        assertNotNull(departments);
        assertEquals(2, departments.size());
        assertTrue(departments.stream().anyMatch(d -> d.getName().equals(DataSeeder.DEPT_ENGINEERING)));
        assertTrue(departments.stream().anyMatch(d -> d.getName().equals(DataSeeder.DEPT_HUMAN_RESOURCES)));
    }

    @Test
    void shouldHaveAdminUserWithCorrectRole() {
        User admin = userRepository.findByUsername("admin").orElseThrow();
        
        assertEquals(Role.ADMIN, admin.getRole());
    }

    @Test
    void shouldHaveManagerUserWithCorrectRole() {
        User manager = userRepository.findByUsername("manager").orElseThrow();
        
        assertEquals(Role.MANAGER, manager.getRole());
    }

    @Test
    void shouldHaveEmployeeUserWithCorrectRole() {
        User employee = userRepository.findByUsername("employee").orElseThrow();
        
        assertEquals(Role.EMPLOYEE, employee.getRole());
    }

    @Test
    void shouldHaveHRUsersWithCorrectRole() {
        User seniorHr = userRepository.findByUsername("seniorhr").orElseThrow();
        User juniorHr = userRepository.findByUsername("juniorhr").orElseThrow();
        
        assertEquals(Role.HR, seniorHr.getRole());
        assertEquals(Role.HR, juniorHr.getRole());
    }

    @Test
    void shouldHaveAllUsersWithJobsAssigned() {
        List<User> users = userRepository.findAll();
        
        for (User user : users) {
            assertNotNull(user.getJob(), "User " + user.getUsername() + " should have a job assigned");
        }
    }

    @Test
    void shouldHaveAllUsersWithDepartmentsAssigned() {
        List<User> users = userRepository.findAll();
        
        for (User user : users) {
            assertNotNull(user.getDepartment(), "User " + user.getUsername() + " should have a department assigned");
        }
    }

    @Test
    void shouldHaveManagerUserWithOverseenDepartment() {
        User manager = userRepository.findByUsername("manager").orElseThrow();
        
        assertNull(manager.getOverseenDepartment(), "Manager should not oversee a department");
    }

    @Test
    void shouldHaveJuniorHRWithOverseenDepartment() {
        User juniorHr = userRepository.findByUsername("juniorhr").orElseThrow();

        assertNotNull(juniorHr.getOverseenDepartment(), "Junior HR should oversee a department");
        assertEquals(DataSeeder.DEPT_ENGINEERING, juniorHr.getOverseenDepartment().getName());
    }

    @Test
    void shouldHaveSeniorHRWithOverseenDepartment() {
        User seniorHr = userRepository.findByUsername("seniorhr").orElseThrow();
        
        assertNotNull(seniorHr.getOverseenDepartment(), "Senior HR should oversee a department");
        assertEquals(DataSeeder.DEPT_HUMAN_RESOURCES, seniorHr.getOverseenDepartment().getName());
    }

    @Test
    void shouldHaveEmployeeWithSupervisor() {
        User employee = userRepository.findByUsername("employee").orElseThrow();
        
        assertNotNull(employee.getSupervisor(), "Employee should have a supervisor");
        assertEquals("manager", employee.getSupervisor().getUsername());
    }

    @Test
    void shouldHaveJuniorHRWithSupervisor() {
        User juniorHr = userRepository.findByUsername("juniorhr").orElseThrow();
        
        assertNotNull(juniorHr.getSupervisor(), "Junior HR should have a supervisor");
        assertEquals("seniorhr", juniorHr.getSupervisor().getUsername());
    }

    @Test
    void shouldHaveAdminWithNoSupervisor() {
        User admin = userRepository.findByUsername("admin").orElseThrow();
        
        assertNull(admin.getSupervisor(), "Admin should not have a supervisor");
    }

    @Test
    void shouldBeIdempotent() throws Exception {
        // Verify initial counts
        long initialUserCount = userRepository.count();
        long initialJobCount = jobRepository.count();
        long initialDeptCount = departmentRepository.count();

        // Run seeder again
        dataSeeder.run();

        // Verify counts haven't changed
        assertEquals(initialUserCount, userRepository.count(), "User count should remain the same after re-running seeder");
        assertEquals(initialJobCount, jobRepository.count(), "Job count should remain the same after re-running seeder");
        assertEquals(initialDeptCount, departmentRepository.count(), "Department count should remain the same after re-running seeder");
    }

    @Test
    void shouldHaveManagerUserWithCorrectJobAndDepartment() {
        User manager = userRepository.findByUsername("manager").orElseThrow();
        
        assertEquals(DataSeeder.JOB_SENIOR_SOFTWARE_ENGINEER, manager.getJob().getTitle());
        assertEquals(DataSeeder.DEPT_ENGINEERING, manager.getDepartment().getName());
    }

    @Test
    void shouldHaveEmployeeUserWithCorrectJobAndDepartment() {
        User employee = userRepository.findByUsername("employee").orElseThrow();
        
        assertEquals(DataSeeder.JOB_JUNIOR_SOFTWARE_ENGINEER, employee.getJob().getTitle());
        assertEquals(DataSeeder.DEPT_ENGINEERING, employee.getDepartment().getName());
    }

    @Test
    void shouldHaveSeniorHRUserWithCorrectJobAndDepartment() {
        User seniorHr = userRepository.findByUsername("seniorhr").orElseThrow();
        
        assertEquals(DataSeeder.JOB_SENIOR_HR, seniorHr.getJob().getTitle());
        assertEquals(DataSeeder.DEPT_HUMAN_RESOURCES, seniorHr.getDepartment().getName());
    }

    @Test
    void shouldHaveJuniorHRUserWithCorrectJobAndDepartment() {
        User juniorHr = userRepository.findByUsername("juniorhr").orElseThrow();
        
        assertEquals(DataSeeder.JOB_JUNIOR_HR, juniorHr.getJob().getTitle());
        assertEquals(DataSeeder.DEPT_HUMAN_RESOURCES, juniorHr.getDepartment().getName());
    }
}
