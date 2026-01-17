"""Digest rendering to HTML and Markdown"""

from datetime import datetime
from pathlib import Path
from typing import Dict

import pytz
from jinja2 import Environment, FileSystemLoader

from app.config import settings


class DigestRenderer:
    """Renders digest to HTML and Markdown formats"""

    def __init__(self):
        # Set up Jinja2 environment
        template_dir = Path(__file__).parent.parent / "templates"
        self.env = Environment(loader=FileSystemLoader(str(template_dir)))

        # Load templates
        self.md_template = self.env.get_template("digest.md.j2")
        self.html_template = self.env.get_template("digest.html.j2")

    def render(self, summary: Dict, date: str, output_dir: str = "out") -> Dict[str, str]:
        """
        Render digest to HTML and Markdown

        Args:
            summary: Summary dict with 'tl_dr' and 'sections'
            date: Date string (YYYY-MM-DD)
            output_dir: Output directory

        Returns:
            Dict with 'html_path' and 'md_path'
        """
        # Create output directory
        output_path = Path(output_dir) / date
        output_path.mkdir(parents=True, exist_ok=True)

        # Get current time in Cairo timezone
        cairo_tz = pytz.timezone(settings.tz)
        now = datetime.now(cairo_tz)
        generated_at = now.strftime("%Y-%m-%d %H:%M %Z")

        # Prepare template context
        context = {
            "date": date,
            "tl_dr": summary.get("tl_dr", ""),
            "sections": summary.get("sections", {}),
            "generated_at": generated_at,
        }

        # Render Markdown
        md_content = self.md_template.render(**context)
        md_path = output_path / "digest.md"
        md_path.write_text(md_content, encoding="utf-8")

        # Render HTML
        html_content = self.html_template.render(**context)
        html_path = output_path / "digest.html"
        html_path.write_text(html_content, encoding="utf-8")

        return {
            "html_path": str(html_path),
            "md_path": str(md_path),
        }
