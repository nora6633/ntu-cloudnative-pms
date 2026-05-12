package edu.ntu.pms.user.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import edu.ntu.pms.user.dto.UserDTO;
import edu.ntu.pms.user.entity.User;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(source = "job.id", target = "jobId")
    @Mapping(source = "department.id", target = "departmentId")
    @Mapping(source = "overseenDepartment.id", target = "overseenDepartmentId")
    @Mapping(source = "supervisor.id", target = "supervisorId")
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "requireProbation", ignore = true)
    @Mapping(target = "probationTemplateId", ignore = true)
    UserDTO toDto(User user);
}
