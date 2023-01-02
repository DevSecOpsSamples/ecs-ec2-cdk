import unittest

import main


class RestAPIsTestCase(unittest.TestCase):

    def test_root(self):
        response = main.app.test_client().get("/")
        self.assertEqual(response.status_code, 200)

    def test_ping(self):
        response = main.app.test_client().get("/ping")
        self.assertEqual(response.status_code, 200)

    def test_ping_path2(self):
        response = main.app.test_client().get("/ping/path2")
        self.assertEqual(response.status_code, 200)

    def test_ping_path3(self):
        response = main.app.test_client().get("/ping/path2/path3")
        self.assertEqual(response.status_code, 200)

    def test_ping_path4(self):
        response = main.app.test_client().get("/ping/path2/path3/path4")
        self.assertEqual(response.status_code, 200)

