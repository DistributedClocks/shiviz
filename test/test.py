from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import os
import unittest

class TestRunner(unittest.TestCase):
    '''
    Class to check the results of the tests in the test.js file. 
    '''

    chrome_options = Options()
    chrome_options.add_argument('--headless')
    driver = webdriver.Chrome(options=chrome_options)
    
    def test_js(self):
        '''
        Workhorse method to check the results of the tests. 

        Opens the index.html file in the test directory by using a headless Chrome browser. 
        Then, parses the list elements from the page and checks its class attribute to determine 
        if the test is failing or passing. If it is failing, treats it like a subtest and fails the  
        subtest by using the test name given in the test.js file.
        '''
        
        self.driver.get("file://" +os.getcwd()+"/test/index.html")
        output = self.driver.find_element_by_id("output")
        test_items = output.find_elements_by_tag_name("li")

        for test_item in test_items:
            is_passing = test_item.get_attribute("class")  == "pass"

            if not is_passing:
                with self.subTest():
                    self.fail(test_item.text)

        self.driver.close()
        
if __name__ == '__main__':
    unittest.main()