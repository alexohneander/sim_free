import unittest

from backend.simc_options import get_default_simc_options


class GetDefaultSimcOptionsTests(unittest.TestCase):
    def test_preserves_existing_defaults_when_profile_has_no_options(self):
        self.assertEqual(
            get_default_simc_options("mage=Example\n"),
            ["iterations=1000", "target_error=0.05", "threads=4"],
        )

    def test_does_not_override_profile_options(self):
        profile = (
            "mage=Example\n"
            "iterations=100000\n"
            "target_error=0.02\n"
            "threads=8\n"
        )

        self.assertEqual(get_default_simc_options(profile), [])

    def test_ignores_comment_lines_and_supports_crlf(self):
        profile = "# iterations=100000\r\nmage=Example\r\n"

        self.assertEqual(
            get_default_simc_options(profile),
            ["iterations=1000", "target_error=0.05", "threads=4"],
        )
