package edu.ntu.pms.user.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import edu.ntu.pms.auth.JwtService;
import edu.ntu.pms.user.dto.UserDTO;
import edu.ntu.pms.user.enums.Role;
import edu.ntu.pms.user.service.UserService;

@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false)
class UserControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private JwtService jwtService;

    @Test
    void registration_ReturnsCreated() throws Exception {
        String inputJson = "{\"username\":\"newadmin\",\"password\":\"password123\",\"role\":\"ADMIN\",\"jobId\":1,\"departmentId\":1}";

        UserDTO output = UserDTO.builder()
                .id(1L)
                .username("newadmin")
                .role(Role.ADMIN)
                .build();

        when(userService.registerUser(any(UserDTO.class))).thenReturn(output);

        mockMvc.perform(post("/users/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(inputJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.username", is("newadmin")))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    void registration_ValidationErrors_ReturnsBadRequest() throws Exception {
        String invalidJson = "{\"username\":\"user\",\"password\":\"short\",\"role\":\"EMPLOYEE\",\"jobId\":1,\"departmentId\":1}";

        mockMvc.perform(post("/users/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors", hasItem(containsString("password: Password must be at least 8 characters long"))));
    }
}
