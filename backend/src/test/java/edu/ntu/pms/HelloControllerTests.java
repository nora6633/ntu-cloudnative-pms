package edu.ntu.pms;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class HelloControllerTests {

    private final HelloController helloController = new HelloController();

    @Test
    void sayHello_returnsGreeting() {
        var response = helloController.sayHello();
        assertEquals("Hello from Spring Boot 25!", response.get("message"));
    }
}
