package edu.ntu.pms.user.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import edu.ntu.pms.user.dto.UserDTO;
import edu.ntu.pms.user.entity.User;
import edu.ntu.pms.user.enums.Role;

@Mapper(componentModel = "spring", imports = {Role.class})
public interface UserMapper {

    @Mapping(source = "job.id", target = "jobId")
    @Mapping(source = "department.id", target = "departmentId")
    @Mapping(source = "overseenDepartment.id", target = "overseenDepartmentId")
    @Mapping(source = "supervisor.id", target = "supervisorId")
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "requireProbation", ignore = true)
    @Mapping(target = "probationTemplateId", ignore = true)
    UserDTO toDto(User user);

    @Mapping(target = "job.id", source = "jobId")
    @Mapping(target = "department.id", source = "departmentId")
    @Mapping(target = "overseenDepartment", ignore = true) // Handled in Service to avoid transient instances
    @Mapping(target = "supervisor.id", source = "supervisorId")
    @Mapping(target = "passwordHash", ignore = true) // Handled in Service
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "subordinates", ignore = true)
    User toEntity(UserDTO dto);
}
