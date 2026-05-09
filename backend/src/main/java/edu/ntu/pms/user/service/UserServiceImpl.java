package edu.ntu.pms.user.service;

import lombok.RequiredArgsConstructor;

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
import edu.ntu.pms.user.mapper.UserMapper;
import edu.ntu.pms.evaluation.service.EvaluationCreationService;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final EvaluationCreationService evaluationCreationService;
    private final UserMapper userMapper;

    @Override
    @Transactional
    public UserDTO registerUser(UserDTO userDTO) {
        if (userRepository.findByUsername(userDTO.getUsername()).isPresent()) {
            throw new IllegalArgumentException("Username already exists");
        }

        if (Boolean.TRUE.equals(userDTO.getRequireProbation())) {
            if (userDTO.getSupervisorId() == null) {
                throw new IllegalArgumentException("Supervisor must be assigned when probation is required");
            }
            if (userDTO.getProbationTemplateId() == null) {
                throw new IllegalArgumentException("probationTemplateId is required when requireProbation is true");
            }
        }

        Job job = jobRepository.findById(userDTO.getJobId())
                .orElseThrow(() -> new IllegalArgumentException("Job ID not found: " + userDTO.getJobId()));
        Department department = departmentRepository.findById(userDTO.getDepartmentId())
                .orElseThrow(
                        () -> new IllegalArgumentException("Department ID not found: " + userDTO.getDepartmentId()));

        Department overseenDepartment = null;
        if (userDTO.getOverseenDepartmentId() != null) {
            overseenDepartment = departmentRepository.findById(userDTO.getOverseenDepartmentId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Overseen Department ID not found: " + userDTO.getOverseenDepartmentId()));
        }

        User supervisor = null;
        if (userDTO.getSupervisorId() != null) {
            supervisor = userRepository.findById(userDTO.getSupervisorId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Supervisor ID not found: " + userDTO.getSupervisorId()));
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

        if (Boolean.TRUE.equals(userDTO.getRequireProbation())) {
            evaluationCreationService.createEvaluationForNewUser(savedUser, userDTO.getProbationTemplateId());
        }

        return userMapper.toDto(savedUser);
    }
}
