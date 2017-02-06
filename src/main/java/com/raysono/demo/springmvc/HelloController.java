package com.raysono.demo.springmvc;

import org.springframework.stereotype.Controller;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@Controller
public class HelloController {
	@RequestMapping(value = "/", method = RequestMethod.GET)
	public String printWelcome(ModelMap model, HttpServletRequest request, HttpServletResponse response) {
		Cookie cookie = new Cookie("newSessionToken", String.valueOf(System.currentTimeMillis()));
		cookie.setPath("/");
		cookie.setHttpOnly(true);
		//		cookie.setSecure(true);
		cookie.setMaxAge(600);
		response.addCookie(cookie);
		model.addAttribute("message", "Azure App Service FTP deployment");
		return "hello";
	}

	@RequestMapping(value = "/data", method = RequestMethod.GET)
	@ResponseBody
	public String someData(HttpServletRequest request, HttpServletResponse response) {
		Cookie cookie = new Cookie("newModelToken", String.valueOf(System.currentTimeMillis()));
		cookie.setPath("/");
		cookie.setHttpOnly(true);
		//		cookie.setSecure(true);
		cookie.setMaxAge(600);
		response.addCookie(cookie);
		return cookie.getValue();
	}
}