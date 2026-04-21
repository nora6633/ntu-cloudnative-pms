package edu.ntu.pms;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
public class HelloControllerTests {
    private final HelloController helloController;

    @Autowired
    public HelloControllerTests(HelloController helloController) {
        this.helloController = helloController;
    }

    @Test
    public void testSayHello() {
        var response = helloController.sayHello();
        assert response.get("message").equals("Hello from Spring Boot 25!");
    }
}
