package edu.ntu.pms.user.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import edu.ntu.pms.user.dto.UserDTO;
import edu.ntu.pms.user.entity.Department;
import edu.ntu.pms.user.entity.Job;
import edu.ntu.pms.user.entity.User;
import edu.ntu.pms.user.repository.DepartmentRepository;
import edu.ntu.pms.user.repository.JobRepository;
import edu.ntu.pms.user.repository.UserRepository;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository userRepository, JobRepository jobRepository,
                           DepartmentRepository departmentRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.jobRepository = jobRepository;
        this.departmentRepository = departmentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public UserDTO registerUser(UserDTO userDTO) {
        if (userRepository.findByUsername(userDTO.getUsername()).isPresent()) {
            throw new IllegalArgumentException("Username already exists");
        }

        // Using getReferenceById to avoid DB hit since we don't check IDs yet (as requested)
        Job job = jobRepository.getReferenceById(userDTO.getJobId());
        Department department = departmentRepository.getReferenceById(userDTO.getDepartmentId());

        Department overseenDepartment = null;
        if (userDTO.getOverseenDepartmentId() != null) {
            overseenDepartment = departmentRepository.getReferenceById(userDTO.getOverseenDepartmentId());
        }

        User supervisor = null;
        if (userDTO.getSupervisorId() != null) {
            supervisor = userRepository.getReferenceById(userDTO.getSupervisorId());
        }

        User user = User.builder()
                .username(userDTO.getUsername())
                .passwordHash(passwordEncoder.encode(userDTO.getPassword()))
                .role(userDTO.getRole())
                .job(job)
                .department(department)
                .overseenDepartment(overseenDepartment)
                .supervisor(supervisor)
                .build();

        User savedUser = userRepository.save(user);

        return UserDTO.builder()
                .id(savedUser.getId())
                .username(savedUser.getUsername())
                .role(savedUser.getRole())
                .jobId(savedUser.getJob().getId())
                .departmentId(savedUser.getDepartment().getId())
                .overseenDepartmentId(savedUser.getOverseenDepartment() != null ? savedUser.getOverseenDepartment().getId() : null)
                .supervisorId(savedUser.getSupervisor() != null ? savedUser.getSupervisor().getId() : null)
                .build();
    }
}
