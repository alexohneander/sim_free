SIMC_DEFAULT_OPTIONS = (
    ("iterations", "1000"),
    ("target_error", "0.05"),
    ("threads", "4"),
)

RAIDBOTS_OPTIONS = (
    ("iterations", "100000"),
    ("desired_targets", "1"),
    ("max_time", "600"),
    ("calculate_scale_factors", "0"),
    ("scale_only", "strength,intellect,agility,crit,mastery,vers,haste,weapon_dps,weapon_offhand_dps"),
    ("override.bloodlust", "1"),
    ("override.arcane_intellect", "1"),
    ("override.power_word_fortitude", "1"),
    ("override.battle_shout", "1"),
    ("override.mystic_touch", "1"),
    ("override.chaos_brand", "1"),
    ("override.skyfury", "1"),
    ("override.mark_of_the_wild", "1"),
    ("override.hunters_mark", "1"),
    ("override.bleeding", "1"),
    ("report_details", "1"),
    ("single_actor_batch", "1"),
    ("optimize_expressions", "1"),
    ("target_error", "0.05"),
)


def get_default_simc_options(
    profile_data: str,
    raidbots_options: bool = False,
) -> list[str]:
    if raidbots_options:
        return [f"{name}={value}" for name, value in RAIDBOTS_OPTIONS]

    configured_options = {
        line.partition("=")[0].strip()
        for line in profile_data.splitlines()
        if "=" in line and not line.lstrip().startswith("#")
    }
    return [
        f"{name}={value}"
        for name, value in SIMC_DEFAULT_OPTIONS
        if name not in configured_options
    ]
