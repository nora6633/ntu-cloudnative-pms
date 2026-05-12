package edu.ntu.pms.user.dto;

import edu.ntu.pms.user.enums.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonProperty;
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
    
    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;
    
    @NotNull(message = "Role is required")
    private Role role;
    
    @NotNull(message = "Job ID is required")
    private Long jobId;
    
    @NotNull(message = "Department ID is required")
    private Long departmentId;
    
    private Long overseenDepartmentId;
    
    private Long supervisorId;
    
    private Boolean requireProbation;
    
    private Long probationTemplateId;
}
