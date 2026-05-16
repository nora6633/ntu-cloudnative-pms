package edu.ntu.pms.user.service;

import edu.ntu.pms.user.dto.UserDTO;
import edu.ntu.pms.user.dto.UserSummaryDTO;
import java.util.List;

public interface UserService {
    UserDTO registerUser(UserDTO userDTO);
    List<UserSummaryDTO> getSupervisors();
}
