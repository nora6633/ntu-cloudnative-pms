package edu.ntu.pms;

import java.util.HashMap;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {
    
    @GetMapping("/hello")
    public Map<String, String> sayHello() {
        // SET BREAKPOINT HERE to inspect when React calls this
        Map<String, String> response = new HashMap<>();
        response.put("message", "Hello from Spring Boot 25!");
        return response;
    }
}
