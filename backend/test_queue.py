import unittest
from pathlib import Path
from unittest.mock import Mock, patch

from queue_backend import (
    JOB_TIMEOUT_SECONDS,
    RESULT_TTL_SECONDS,
    enqueue_simulation,
    get_queue_position,
    get_simulation_queue,
)
from tasks import run_simulation


class SimulationQueueTests(unittest.TestCase):
    def test_queue_uses_configured_connection_and_name(self):
        connection = Mock()
        with patch(
            "queue_backend.get_redis_connection",
            return_value=connection,
        ):
            queue = get_simulation_queue()

        self.assertEqual(queue.name, "simulations")
        self.assertIs(queue.connection, connection)

    def test_queue_position_is_one_based_and_handles_missing_jobs(self):
        job = Mock()
        queue = Mock()
        with patch("queue_backend.get_simulation_queue", return_value=queue):
            queue.get_job_position.return_value = 0
            self.assertEqual(get_queue_position(job), 1)

            queue.get_job_position.return_value = 4
            self.assertEqual(get_queue_position(job), 5)

            queue.get_job_position.return_value = None
            self.assertIsNone(get_queue_position(job))

    @patch("queue_backend.get_simulation_queue")
    @patch("tasks.run_simulation")
    def test_enqueue_persists_jobs_and_reports_for_24_hours(
        self,
        run_simulation,
        get_queue,
    ):
        job = Mock()
        get_queue.return_value.enqueue.return_value = job

        self.assertIs(enqueue_simulation("mage=Example\n"), job)

        get_queue.return_value.enqueue.assert_called_once_with(
            run_simulation,
            "mage=Example\n",
            job_timeout=JOB_TIMEOUT_SECONDS,
            result_ttl=RESULT_TTL_SECONDS,
            failure_ttl=RESULT_TTL_SECONDS,
        )
        self.assertEqual(RESULT_TTL_SECONDS, 24 * 60 * 60)

    @patch("tasks.Simc")
    @patch("tasks.HtmlExport")
    @patch("tasks.Profile")
    @patch("tasks.Arguments")
    def test_simulation_returns_report_and_removes_temporary_files(
        self,
        arguments,
        profile,
        html_export,
        simc,
    ):
        runner = simc.return_value
        runner.add_args.return_value = runner
        runner.last_query = {"returncode": 0}

        def write_report():
            Path(html_export.call_args.args[0]).write_text(
                "<html>simulation report</html>",
                encoding="utf-8",
            )

        runner.run.side_effect = write_report

        report = run_simulation("mage=Example\n")

        profile_path = Path(profile.call_args.args[0])
        temp_directory = profile_path.parent
        self.assertEqual(report, "<html>simulation report</html>")
        self.assertFalse(temp_directory.exists())
        self.assertEqual(
            Path(simc.call_args.kwargs["export_path"]).parent,
            temp_directory,
        )
        arguments.assert_called_once()

    @patch("tasks.Simc")
    @patch("tasks.HtmlExport")
    @patch("tasks.Profile")
    @patch("tasks.Arguments")
    def test_simulation_failure_is_reported_and_files_are_removed(
        self,
        arguments,
        profile,
        html_export,
        simc,
    ):
        runner = simc.return_value
        runner.add_args.return_value = runner
        runner.run.side_effect = RuntimeError("SimulationCraft failed")

        with self.assertRaisesRegex(RuntimeError, "SimulationCraft failed"):
            run_simulation("mage=Example\n")

        temp_directory = Path(profile.call_args.args[0]).parent
        self.assertFalse(temp_directory.exists())
        arguments.assert_called_once()
        html_export.assert_called_once()

    @patch("tasks.Simc")
    @patch("tasks.HtmlExport")
    @patch("tasks.Profile")
    @patch("tasks.Arguments")
    def test_nonzero_simulation_exit_is_not_returned_as_success(
        self,
        arguments,
        profile,
        html_export,
        simc,
    ):
        runner = simc.return_value
        runner.add_args.return_value = runner
        runner.last_query = {"returncode": 1}

        def write_report():
            Path(html_export.call_args.args[0]).write_text(
                "<html>partial output</html>",
                encoding="utf-8",
            )

        runner.run.side_effect = write_report

        with self.assertRaisesRegex(RuntimeError, "did not complete successfully"):
            run_simulation("mage=Example\n")

        self.assertFalse(Path(profile.call_args.args[0]).parent.exists())
        arguments.assert_called_once()


if __name__ == "__main__":
    unittest.main()
