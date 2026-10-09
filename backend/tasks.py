import tempfile
from pathlib import Path

from simcrunner import Arguments, Profile, Simc
from simcrunner.simc import HtmlExport

from simc_options import get_default_simc_options


def run_simulation(simcprofile: str, raidbots_options: bool = False) -> str:
    with tempfile.TemporaryDirectory(prefix="opensim-") as temp_directory:
        profile_path = Path(temp_directory) / "profile.simc"
        export_path = Path(temp_directory) / "report.html"
        profile_path.write_text(simcprofile, encoding="utf-8")

        profile = Profile(str(profile_path))
        args = Arguments(
            profile,
            *get_default_simc_options(simcprofile, raidbots_options),
        )
        runner = Simc(
            simc_path="./",
            export_path=str(Path(temp_directory) / "simcrunner-export.simc"),
        )
        runner.add_args(args, HtmlExport(str(export_path))).run()

        if runner.last_query.get("returncode") != 0:
            raise RuntimeError("SimulationCraft did not complete successfully.")
        if not export_path.is_file():
            raise RuntimeError("SimulationCraft completed without producing a report.")
        report = export_path.read_text(encoding="utf-8")
        if not report.strip():
            raise RuntimeError("SimulationCraft produced an empty report.")
        return report
