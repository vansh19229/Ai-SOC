"""
Incident report generator – produces structured markdown / dict reports.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List


class ReportGenerator:
    def generate_report(self, incident_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a comprehensive incident report.

        Returns a dict with:
            report_text  : str  (markdown)
            executive_summary : str
            technical_details : dict
            recommendations   : list[str]
            generated_at      : str
        """
        now = datetime.utcnow().isoformat()
        title = incident_data.get("title", "Security Incident")
        itype = incident_data.get("type", "unknown")
        severity = incident_data.get("severity", "medium")
        source_ip = incident_data.get("source_ip", "N/A")
        affected = incident_data.get("affected_systems", [])
        description = incident_data.get("description", "")
        timeline = incident_data.get("timeline", [])
        actions = incident_data.get("actions_taken", [])

        exec_summary = (
            f"A {severity.upper()} severity {itype.replace('_', ' ')} incident was detected "
            f"originating from {source_ip}. "
            f"Affected systems: {', '.join(affected) if affected else 'Unknown'}. "
            f"Immediate investigation and remediation actions have been initiated."
        )

        recommendations = self._recommendations(itype, severity)

        technical_details = {
            "incident_type": itype,
            "source_ip": source_ip,
            "severity": severity,
            "affected_systems": affected,
            "detection_timestamp": incident_data.get("timestamp", now),
            "timeline_events": len(timeline),
            "actions_taken": actions,
        }

        report_md = self._render_markdown(
            title=title,
            exec_summary=exec_summary,
            description=description,
            technical_details=technical_details,
            timeline=timeline,
            recommendations=recommendations,
            generated_at=now,
        )

        return {
            "report_text": report_md,
            "executive_summary": exec_summary,
            "technical_details": technical_details,
            "recommendations": recommendations,
            "generated_at": now,
        }

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _recommendations(itype: str, severity: str) -> List[str]:
        base = [
            "Review and update firewall rules to restrict suspicious traffic.",
            "Ensure all systems are patched with the latest security updates.",
            "Conduct a post-incident review to identify root cause.",
            "Update incident response playbooks based on findings.",
        ]
        type_specific = {
            "ransomware": [
                "Immediately isolate affected systems from the network.",
                "Restore from clean, verified backups.",
                "Engage ransomware response specialists.",
            ],
            "phishing_campaign": [
                "Block sender domains at the email gateway.",
                "Reset passwords for all users who clicked phishing links.",
                "Conduct phishing awareness training.",
            ],
            "brute_force": [
                "Enable multi-factor authentication for all accounts.",
                "Implement account lockout policies.",
                "Block source IPs at the perimeter firewall.",
            ],
            "data_exfiltration": [
                "Revoke credentials of compromised accounts.",
                "Notify affected data owners and legal/compliance teams.",
                "Enable DLP controls on sensitive data repositories.",
            ],
            "ddos_attack": [
                "Activate DDoS mitigation services.",
                "Rate-limit traffic at the edge.",
                "Contact upstream ISP for traffic scrubbing.",
            ],
        }
        return base + type_specific.get(itype, [])

    @staticmethod
    def _render_markdown(
        title: str,
        exec_summary: str,
        description: str,
        technical_details: Dict[str, Any],
        timeline: List[Dict[str, Any]],
        recommendations: List[str],
        generated_at: str,
    ) -> str:
        lines = [
            f"# Incident Report: {title}",
            f"\n**Generated:** {generated_at}  ",
            f"**Severity:** {technical_details.get('severity', 'N/A').upper()}",
            "",
            "## Executive Summary",
            exec_summary,
            "",
            "## Description",
            description or "_No description provided._",
            "",
            "## Technical Details",
            f"- **Type:** {technical_details.get('incident_type')}",
            f"- **Source IP:** {technical_details.get('source_ip')}",
            f"- **Affected Systems:** {', '.join(technical_details.get('affected_systems', []))}",
            f"- **Detection Time:** {technical_details.get('detection_timestamp')}",
            "",
            "## Timeline",
        ]
        if timeline:
            for event in timeline:
                lines.append(f"- `{event.get('time', 'N/A')}` – {event.get('event', '')}")
        else:
            lines.append("_No timeline entries._")

        lines += [
            "",
            "## Actions Taken",
        ]
        actions = technical_details.get("actions_taken", [])
        if actions:
            for action in actions:
                lines.append(f"- {action}")
        else:
            lines.append("_No actions recorded._")

        lines += [
            "",
            "## Recommendations",
        ]
        for rec in recommendations:
            lines.append(f"- {rec}")

        lines += [
            "",
            "---",
            "_Report generated by AI-SOC Automated Response System_",
        ]
        return "\n".join(lines)
