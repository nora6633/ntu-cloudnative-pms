package edu.ntu.pms.evaluation.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import edu.ntu.pms.auth.JwtService;
import edu.ntu.pms.evaluation.dto.CreateProgressDTO;
import edu.ntu.pms.evaluation.dto.GoalDTO;
import edu.ntu.pms.evaluation.service.GoalService;

@WebMvcTest(GoalController.class)
@AutoConfigureMockMvc(addFilters = false) // Disable security filters for testing
class GoalControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private GoalService goalService;

    @MockitoBean
    private JwtService jwtService; 

    @Test
    void addProgress_returnsOkAndGoalDto() throws Exception {
        GoalDTO mockGoalDto = new GoalDTO(1L, "Definition", "Metric", "Resource", "Relevance", null, null, null);
        when(goalService.addProgress(eq(1L), any(CreateProgressDTO.class))).thenReturn(mockGoalDto);

        String payload = "{\"description\":\"Completed step 1\"}";

        mockMvc.perform(post("/goals/1/progress")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.definition").value("Definition"));

        verify(goalService, times(1)).addProgress(eq(1L), any(CreateProgressDTO.class));
    }

    @Test
    void addProgress_invalidDto_returnsBadRequest() throws Exception {
        String payload = "{\"description\":\"\"}"; // Blank description should fail @NotBlank

        mockMvc.perform(post("/goals/1/progress")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Validation Failed"))
                .andExpect(jsonPath("$.errors").isArray());
        
        verify(goalService, never()).addProgress(anyLong(), any(CreateProgressDTO.class));
    }
}
