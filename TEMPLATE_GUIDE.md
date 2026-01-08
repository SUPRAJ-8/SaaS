# How to Create a Custom Section Template

To upload a new section to the Super Admin Dashboard that is fully editable in the Page Builder, you must create a JSON file with the following structure.

## File Structure

Save this as `my-template.json`.

```json
{
  "id": "unique-template-id",
  "name": "My Custom Header",
  "category": "Hero",
  "description": "A brief description of this section",
  "type": "dynamic", 
  
  "schema": [
    // Define the fields you want to edit in the sidebar
    { 
      "key": "title", 
      "type": "text", 
      "label": "Headline", 
      "default": "Hello World" 
    },
    { 
      "key": "bg_color", 
      "type": "color", 
      "label": "Background Color", 
      "default": "#ffffff" 
    },
    { 
      "key": "hero_image", 
      "type": "image", 
      "label": "Main Image",
      "default": "https://via.placeholder.com/800x400"
    },
    {
      "key": "show_button",
      "type": "boolean",
      "label": "Show Button",
      "default": true
    }
  ],

  "structure": {
    // Define the HTML structure
    "tag": "div",
    "style": { 
      "backgroundColor": "{{bg_color}}", 
      "padding": "60px 20px", 
      "textAlign": "center" 
    },
    "children": [
      {
        "tag": "h2",
        "className": "custom-title",
        "text": "{{title}}"
      },
      {
        "tag": "img",
        "className": "custom-image",
        "props": {
           "src": "{{hero_image}}",
           "alt": "Hero"
        },
        "style": { "maxWidth": "100%", "marginTop": "20px" }
      },
      {
        "tag": "button",
        "condition": "show_button",
        "className": "custom-btn",
        "text": "Click Me"
      }
    ]
  },

  "styles": ".custom-title { font-size: 3rem; color: #333; } .custom-btn { margin-top: 20px; padding: 10px 20px; background: #000; color: #fff; }"
}
```

## Field Types Allowed in Schema
*   `text`: Simple text input
*   `textarea`: Multi-line text area
*   `color`: Color picker
*   `image`: Image URL input (with preview)
*   `boolean`: Toggle switch (True/False)
*   `select`: Dropdown menu (requires `"options": [{"label": "A", "value": "a"}]`)

## Using Variables
*   Use `{{key_name}}` in your `structure` to inject values from the schema.
*   Example: If schema key is `title`, use `{{title}}` in the text or props.

## Conditions
*   Use `"condition": "key_name"` to show/hide an element based on a boolean field.
*   Use `"condition": "!key_name"` to show/hide if false.
