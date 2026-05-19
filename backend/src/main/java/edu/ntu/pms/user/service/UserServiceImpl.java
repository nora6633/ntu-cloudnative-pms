package edu.ntu.pms.user.service;

import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import edu.ntu.pms.user.dto.UserDTO;
import edu.ntu.pms.user.dto.UserSummaryDTO;
import edu.ntu.pms.user.entity.Department;
import edu.ntu.pms.user.entity.Job;
import edu.ntu.pms.user.entity.User;
import edu.ntu.pms.user.repository.DepartmentRepository;
import edu.ntu.pms.user.repository.JobRepository;
import edu.ntu.pms.user.repository.UserRepository;
import edu.ntu.pms.user.mapper.UserMapper;
import edu.ntu.pms.user.enums.Role;
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
        // Business Validation
        validateRegistrationRequest(userDTO);

        // Map DTO to Entity
        User user = userMapper.toEntity(userDTO);
        
        // Handle sensitive fields and complex lookups
        user.setPasswordHash(passwordEncoder.encode(userDTO.getPassword()));
        
        // Fetch full entities to ensure state consistency and validation
        Job job = jobRepository.findById(userDTO.getJobId())
                .orElseThrow(() -> new IllegalArgumentException("Job ID not found: " + userDTO.getJobId()));
        Department department = departmentRepository.findById(userDTO.getDepartmentId())
                .orElseThrow(() -> new IllegalArgumentException("Department ID not found: " + userDTO.getDepartmentId()));
        
        user.setJob(job);
        user.setDepartment(department);

        if (userDTO.getOverseenDepartmentId() != null) {
            Department overseen = departmentRepository.findById(userDTO.getOverseenDepartmentId())
                    .orElseThrow(() -> new IllegalArgumentException("Overseen Dept not found: " + userDTO.getOverseenDepartmentId()));
            user.setOverseenDepartment(overseen);
        }

        if (userDTO.getSupervisorId() != null) {
            User supervisor = userRepository.findById(userDTO.getSupervisorId())
                    .orElseThrow(() -> new IllegalArgumentException("Supervisor not found: " + userDTO.getSupervisorId()));
            user.setSupervisor(supervisor);
        }

        // Save (Atomic uniqueness check via DB constraint)
        User savedUser;
        try {
            savedUser = userRepository.save(user);
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            // Check if it's likely a duplicate username (simplified for this context)
            throw new IllegalArgumentException("Username already exists", ex);
        }

        // Post-save actions (Probation)
        if (Boolean.TRUE.equals(userDTO.getRequireProbation())) {
            evaluationCreationService.createEvaluationForNewUser(savedUser, userDTO.getProbationTemplateId());
        }

        return userMapper.toDto(savedUser);
    }

    @Override
    public List<UserSummaryDTO> getSupervisors() {
        return userRepository.findByRoleIn(List.of(Role.MANAGER, Role.HR)).stream()
                .map(u -> new UserSummaryDTO(u.getId(), u.getUsername(), u.getRole()))
                .toList();
    }

    private void validateRegistrationRequest(UserDTO dto) {
        if (Boolean.TRUE.equals(dto.getRequireProbation())) {
            if (dto.getSupervisorId() == null) {
                throw new IllegalArgumentException("Supervisor must be assigned when probation is required");
            }
            if (dto.getProbationTemplateId() == null) {
                throw new IllegalArgumentException("probationTemplateId is required when requireProbation is true");
            }
        }

        if (Role.EMPLOYEE.equals(dto.getRole()) && dto.getSupervisorId() == null) {
            throw new IllegalArgumentException("Supervisor must be assigned for EMPLOYEE accounts");
        }

        if (Role.HR.equals(dto.getRole()) && dto.getOverseenDepartmentId() == null) {
            throw new IllegalArgumentException("overseenDepartmentId is required for HR roles");
        }

        if (!Role.HR.equals(dto.getRole()) && dto.getOverseenDepartmentId() != null) {
            throw new IllegalArgumentException("overseenDepartmentId is not allowed for non-HR roles");
        }
    }
}
