package edu.ntu.pms.user.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import jakarta.servlet.http.Cookie;

import edu.ntu.pms.seeders.DataSeeder;
import edu.ntu.pms.auth.JwtService;
import edu.ntu.pms.user.entity.Department;
import edu.ntu.pms.user.entity.Job;
import edu.ntu.pms.user.entity.User;
import edu.ntu.pms.user.repository.DepartmentRepository;
import edu.ntu.pms.user.repository.JobRepository;
import edu.ntu.pms.user.repository.UserRepository;

@Tag("integration")
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
@Transactional
class UserControllerIT {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private DataSeeder dataSeeder;

    @Value("${app.cookie.name}")
    private String cookieName;

    @BeforeEach
    void setUp() throws Exception {
        dataSeeder.run();
    }

    @Test
    void unauthenticatedUserCannotAccessRegister() throws Exception {
        Job job = jobRepository.findAll().get(0);
        Department dept = departmentRepository.findAll().get(0);
        User supervisor = userRepository.findByUsername("manager").orElseThrow();

        String payload = String.format("""
            {
              "username": "newuser",
              "password": "password123",
              "role": "EMPLOYEE",
              "jobId": %d,
              "departmentId": %d,
              "supervisorId": %d
            }
            """, job.getId(), dept.getId(), supervisor.getId());

        mvc.perform(post("/users/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void employeeCannotAccessRegister() throws Exception {
        User employee = userRepository.findByUsername("employee").orElseThrow();
        String token = jwtService.issue(employee);
        Cookie cookie = new Cookie(cookieName, token);

        Job job = jobRepository.findAll().get(0);
        Department dept = departmentRepository.findAll().get(0);
        User supervisor = userRepository.findByUsername("manager").orElseThrow();

        String payload = String.format("""
            {
              "username": "newuser",
              "password": "password123",
              "role": "EMPLOYEE",
              "jobId": %d,
              "departmentId": %d,
              "supervisorId": %d
            }
            """, job.getId(), dept.getId(), supervisor.getId());

        mvc.perform(post("/users/register")
                .cookie(cookie)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
            .andExpect(status().isForbidden());
    }

    @Test
    void adminCanRegisterUser() throws Exception {
        User admin = userRepository.findByUsername("admin").orElseThrow();
        String token = jwtService.issue(admin);
        Cookie cookie = new Cookie(cookieName, token);

        Job job = jobRepository.findAll().get(0);
        Department dept = departmentRepository.findAll().get(0);
        User supervisor = userRepository.findByUsername("manager").orElseThrow();

        String payload = String.format("""
            {
              "username": "newuser",
              "password": "password123",
              "role": "EMPLOYEE",
              "jobId": %d,
              "departmentId": %d,
              "supervisorId": %d
            }
            """, job.getId(), dept.getId(), supervisor.getId());

        mvc.perform(post("/users/register")
                .cookie(cookie)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
            .andExpect(status().isCreated());
    }
}
