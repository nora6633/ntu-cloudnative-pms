package edu.ntu.pms.user.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.dao.DataIntegrityViolationException;

import edu.ntu.pms.user.dto.UserDTO;
import edu.ntu.pms.user.entity.Department;
import edu.ntu.pms.user.entity.Job;
import edu.ntu.pms.user.entity.User;
import edu.ntu.pms.user.enums.Role;
import edu.ntu.pms.user.mapper.UserMapper;
import edu.ntu.pms.user.repository.DepartmentRepository;
import edu.ntu.pms.user.repository.JobRepository;
import edu.ntu.pms.user.repository.UserRepository;
import edu.ntu.pms.evaluation.service.EvaluationCreationService;

public class UserServiceImplTests {

    private UserRepository userRepo;
    private JobRepository jobRepo;
    private DepartmentRepository deptRepo;
    private PasswordEncoder passwordEncoder;
    private EvaluationCreationService evaluationService;
    private UserMapper userMapper;
    private UserServiceImpl svc;

    @BeforeEach
    void setUp() {
        userRepo = mock(UserRepository.class);
        jobRepo = mock(JobRepository.class);
        deptRepo = mock(DepartmentRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        evaluationService = mock(EvaluationCreationService.class);
        userMapper = mock(UserMapper.class);
        svc = new UserServiceImpl(userRepo, jobRepo, deptRepo, passwordEncoder, evaluationService, userMapper);
    }

    @Test
    void registerUser_Success() {
        UserDTO input = UserDTO.builder()
                .username("testuser")
                .password("password123")
                .role(Role.EMPLOYEE)
                .jobId(1L)
                .departmentId(1L)
                .supervisorId(2L)
                .build();

        Job job = Job.builder().id(1L).build();
        Department dept = Department.builder().id(1L).build();
        User supervisor = User.builder().id(2L).build();
        User mappedUser = new User();
        User savedUser = User.builder().id(10L).username("testuser").build();

        when(userMapper.toEntity(any(UserDTO.class))).thenReturn(mappedUser);
        when(jobRepo.findById(1L)).thenReturn(Optional.of(job));
        when(deptRepo.findById(1L)).thenReturn(Optional.of(dept));
        when(userRepo.findById(2L)).thenReturn(Optional.of(supervisor));
        when(passwordEncoder.encode("password123")).thenReturn("hashed_password");
        when(userRepo.save(any(User.class))).thenReturn(savedUser);
        when(userMapper.toDto(savedUser)).thenReturn(UserDTO.builder().id(10L).username("testuser").build());

        UserDTO result = svc.registerUser(input);

        assertNotNull(result);
        assertEquals(10L, result.getId());
        verify(userRepo).save(mappedUser);
    }

    @Test
    void registerUser_DuplicateUsername_ThrowsException() {
        UserDTO input = UserDTO.builder().username("exists").password("pwd").jobId(1L).departmentId(1L).role(Role.ADMIN).build();
        
        when(userMapper.toEntity(any())).thenReturn(new User());
        when(jobRepo.findById(anyLong())).thenReturn(Optional.of(new Job()));
        when(deptRepo.findById(anyLong())).thenReturn(Optional.of(new Department()));
        when(userRepo.save(any(User.class))).thenThrow(new DataIntegrityViolationException("duplicate"));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> svc.registerUser(input));
        assertEquals("Username already exists", ex.getMessage());
    }

    @Test
    void registerUser_InvalidJobId_ThrowsException() {
        UserDTO input = UserDTO.builder().username("user").role(Role.ADMIN).jobId(99L).departmentId(1L).build();
        when(userMapper.toEntity(any())).thenReturn(new User());
        when(jobRepo.findById(99L)).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> svc.registerUser(input));
        assertTrue(ex.getMessage().contains("Job ID not found"));
    }

    @Test
    void registerUser_ProbationMissingSupervisor_ThrowsException() {
        UserDTO input = UserDTO.builder()
                .username("user")
                .role(Role.ADMIN)
                .requireProbation(true)
                .probationTemplateId(1L)
                .build();
        
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> svc.registerUser(input));
        assertEquals("Supervisor must be assigned when probation is required", ex.getMessage());
    }

    @Test
    void registerUser_WithOverseenDepartment_Success() {
        UserDTO input = UserDTO.builder()
                .username("hruser")
                .role(Role.HR)
                .jobId(1L)
                .departmentId(1L)
                .overseenDepartmentId(2L)
                .build();

        Job job = Job.builder().id(1L).build();
        Department dept = Department.builder().id(1L).build();
        Department overseenDept = Department.builder().id(2L).build();
        User savedUser = User.builder().id(20L).overseenDepartment(overseenDept).build();

        when(userMapper.toEntity(any())).thenReturn(new User());
        when(jobRepo.findById(1L)).thenReturn(Optional.of(job));
        when(deptRepo.findById(1L)).thenReturn(Optional.of(dept));
        when(deptRepo.findById(2L)).thenReturn(Optional.of(overseenDept));
        when(userRepo.save(any(User.class))).thenReturn(savedUser);
        when(userMapper.toDto(savedUser)).thenReturn(UserDTO.builder().id(20L).overseenDepartmentId(2L).build());

        UserDTO result = svc.registerUser(input);

        assertEquals(2L, result.getOverseenDepartmentId());
    }

    @Test
    void registerUser_EmployeeMissingSupervisor_ThrowsException() {
        UserDTO input = UserDTO.builder()
                .username("emp")
                .role(Role.EMPLOYEE)
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> svc.registerUser(input));
        assertEquals("Supervisor must be assigned for EMPLOYEE accounts", ex.getMessage());
    }
}
