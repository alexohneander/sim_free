SIMC_DEFAULT_OPTIONS = (
    ("iterations", "1000"),
    ("target_error", "0.05"),
    ("threads", "4"),
)


def get_default_simc_options(profile_data: str) -> list[str]:
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
