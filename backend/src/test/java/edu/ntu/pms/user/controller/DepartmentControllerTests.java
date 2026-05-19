package edu.ntu.pms.user.controller;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import edu.ntu.pms.auth.JwtService;
import edu.ntu.pms.user.entity.Department;
import edu.ntu.pms.user.repository.DepartmentRepository;

@WebMvcTest(DepartmentController.class)
@AutoConfigureMockMvc(addFilters = false)
class DepartmentControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DepartmentRepository departmentRepository;

    @MockitoBean
    private JwtService jwtService;

    @Test
    void getAllDepartments_ReturnsOkAndJson() throws Exception {
        Department engineering = Department.builder().id(1L).name("Engineering").build();
        Department hr = Department.builder().id(2L).name("Human Resources").build();

        when(departmentRepository.findAll()).thenReturn(List.of(engineering, hr));

        mockMvc.perform(get("/departments"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].name", is("Engineering")))
                .andExpect(jsonPath("$[1].name", is("Human Resources")));

        verify(departmentRepository).findAll();
    }
}
