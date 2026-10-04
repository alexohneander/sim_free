import unittest

from backend.simc_options import get_default_simc_options

RAIDBOTS_SIMC_OPTIONS = [
    "iterations=100000",
    "desired_targets=1",
    "max_time=600",
    "calculate_scale_factors=0",
    "scale_only=strength,intellect,agility,crit,mastery,vers,haste,weapon_dps,weapon_offhand_dps",
    "override.bloodlust=1",
    "override.arcane_intellect=1",
    "override.power_word_fortitude=1",
    "override.battle_shout=1",
    "override.mystic_touch=1",
    "override.chaos_brand=1",
    "override.skyfury=1",
    "override.mark_of_the_wild=1",
    "override.hunters_mark=1",
    "override.bleeding=1",
    "report_details=1",
    "single_actor_batch=1",
    "optimize_expressions=1",
    "target_error=0.05",
]


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

    def test_raidbots_options_include_the_complete_preset(self):
        self.assertEqual(
            get_default_simc_options("mage=Example\n", raidbots_options=True),
            RAIDBOTS_SIMC_OPTIONS,
        )

    def test_raidbots_preset_overrides_profile_options(self):
        profile = "iterations=2000\ntarget_error=0.01\n"

        self.assertEqual(
            get_default_simc_options(profile, raidbots_options=True),
            RAIDBOTS_SIMC_OPTIONS,
        )
