package edu.ntu.pms.user.mapper;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import edu.ntu.pms.user.dto.UserDTO;
import edu.ntu.pms.user.entity.Department;
import edu.ntu.pms.user.entity.Job;
import edu.ntu.pms.user.entity.User;
import edu.ntu.pms.user.enums.Role;

public class UserMapperTests {

    private final UserMapper mapper = Mappers.getMapper(UserMapper.class);

    @Test
    void toDto_mapsFieldsCorrectly() {
        // Arrange
        Job job = Job.builder().id(1L).title("Dev").build();
        Department dept = Department.builder().id(2L).name("Eng").build();
        Department overseenDept = Department.builder().id(4L).name("HR").build();
        User supervisor = User.builder().id(3L).username("boss").build();

        User user = User.builder()
                .id(10L)
                .username("testuser")
                .role(Role.EMPLOYEE)
                .job(job)
                .department(dept)
                .overseenDepartment(overseenDept)
                .supervisor(supervisor)
                .build();

        // Act
        UserDTO dto = mapper.toDto(user);

        // Assert
        assertEquals(10L, dto.getId());
        assertEquals("testuser", dto.getUsername());
        assertEquals(Role.EMPLOYEE, dto.getRole());
        assertEquals(1L, dto.getJobId());
        assertEquals(2L, dto.getDepartmentId());
        assertEquals(4L, dto.getOverseenDepartmentId());
        assertEquals(3L, dto.getSupervisorId());
        assertNull(dto.getPassword());
        assertNull(dto.getRequireProbation());
        assertNull(dto.getProbationTemplateId());
    }

    @Test
    void toDto_withNullRelations_mapsCorrectly() {
        User user = User.builder()
                .id(11L)
                .username("lone_wolf")
                .role(Role.ADMIN)
                .build();

        UserDTO dto = mapper.toDto(user);

        assertEquals(11L, dto.getId());
        assertNull(dto.getJobId());
        assertNull(dto.getDepartmentId());
        assertNull(dto.getSupervisorId());
    }
}
