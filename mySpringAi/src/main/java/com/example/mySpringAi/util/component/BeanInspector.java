package com.example.mySpringAi.util.component;

import jakarta.annotation.PostConstruct;
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
public class BeanInspector {

    private final ApplicationContext ctx;

    @Autowired
    public BeanInspector(ApplicationContext ctx) {
        this.ctx = ctx;
    }


    @PostConstruct
    public void inspect() {
        System.out.println("=== Inspecting JdbcChatMemoryRepository Beans ===");

        /*String[] beanNames = ctx.getBeanNamesForType(JdbcChatMemoryRepository.class);*/
        /*String[] beanNames = ctx.getBeanDefinitionNames();

        for (String name : beanNames) {
            System.out.println(" -> " + name);
        }*/

        System.out.println(
                Arrays.toString(
                        ctx.getBeanNamesForType(ToolCallbackProvider.class) // mcpToolCallbacks
                )
        );

        System.out.println("==================================================");
    }
}