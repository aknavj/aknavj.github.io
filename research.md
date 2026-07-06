---
layout: section
title: Research
subtitle: Long-form writeups — reverse engineering, rendering, and engine architecture. Findings from the disassembler and the renderer.
permalink: /research/
index_label: "04"
wide: true
---
<div class="research-list">
  {% for post in site.posts %}
  {% assign catlist = post.categories | join: ' ' | split: ' ' %}
  <a class="research-item" href="{{ post.url | relative_url }}">
    <span class="ri-date mono">{{ post.date | date: "%Y.%m.%d" }}</span>
    <span class="ri-main">
      <span class="ri-title">{{ post.title }}</span>
      <span class="ri-desc">{{ post.description | default: post.excerpt | strip_html | truncatewords: 26 }}</span>
    </span>
    {% if catlist.size > 0 %}<span class="ri-cat">{{ catlist | join: " / " }}</span>{% endif %}
  </a>
  {% endfor %}
</div>
