package edu.ntu.pms.user.dto;

import edu.ntu.pms.user.enums.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    
    @NotBlank(message = "Username is required")
    private String username;
    
    private String password;
    
    @NotNull(message = "Role is required")
    private Role role;
    
    @NotNull(message = "Job ID is required")
    private Long jobId;
    
    @NotNull(message = "Department ID is required")
    private Long departmentId;
    
    private Long overseenDepartmentId;
    
    private Long supervisorId;
}
