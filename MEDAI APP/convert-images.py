#!/usr/bin/env python3
"""
SVG to PNG Converter for MEDAI App Assets
-----------------------------------------
This script converts all SVG files in a directory (and its subdirectories)
to PNG format while maintaining the directory structure.
"""

import os
import argparse
import glob
from pathlib import Path
import cairosvg

def convert_svg_to_png(svg_path, output_dir=None, scale=1.0, background_color=None):
    """
    Convert a single SVG file to PNG format.
    
    Parameters:
    - svg_path: Path to the SVG file
    - output_dir: Directory to save the PNG (if None, use the same directory)
    - scale: Scale factor for the output image
    - background_color: Background color (None for transparent)
    
    Returns:
    - Path to the generated PNG file
    """
    svg_path = Path(svg_path)
    
    # Determine output path
    if output_dir is None:
        png_path = svg_path.with_suffix('.png')
    else:
        output_dir = Path(output_dir)
        relative_path = svg_path.relative_to(start_dir)
        new_dir = output_dir / relative_path.parent
        new_dir.mkdir(parents=True, exist_ok=True)
        png_path = new_dir / (svg_path.stem + '.png')
    
    # Convert SVG to PNG
    try:
        cairosvg.svg2png(
            url=str(svg_path),
            write_to=str(png_path),
            scale=scale,
            background_color=background_color
        )
        return png_path
    except Exception as e:
        print(f"Error converting {svg_path}: {e}")
        return None

def convert_all_svgs(start_dir, output_dir=None, scale=1.0, background_color=None):
    """
    Convert all SVG files in a directory and its subdirectories to PNG.
    
    Parameters:
    - start_dir: Starting directory to search for SVG files
    - output_dir: Directory to save PNG files (if None, use the same directories as SVGs)
    - scale: Scale factor for the output images
    - background_color: Background color (None for transparent)
    
    Returns:
    - List of paths to the generated PNG files
    """
    start_dir = Path(start_dir)
    svg_files = list(start_dir.glob('**/*.svg'))
    
    if not svg_files:
        print(f"No SVG files found in {start_dir}")
        return []
    
    print(f"Found {len(svg_files)} SVG files to convert")
    
    png_files = []
    for svg_file in svg_files:
        print(f"Converting {svg_file}...")
        png_file = convert_svg_to_png(svg_file, output_dir, scale, background_color)
        if png_file:
            png_files.append(png_file)
            print(f"  Created {png_file}")
    
    return png_files

if __name__ == "__main__":
    # Set up command line arguments
    parser = argparse.ArgumentParser(description='Convert SVG files to PNG')
    parser.add_argument('--dir', '-d', default='assets', 
                        help='Directory to search for SVG files (default: assets)')
    parser.add_argument('--output', '-o', default=None,
                        help='Output directory for PNG files (default: same as SVG)')
    parser.add_argument('--scale', '-s', type=float, default=1.0,
                        help='Scale factor for output images (default: 1.0)')
    parser.add_argument('--background', '-b', default=None,
                        help='Background color (default: transparent)')
    parser.add_argument('--app-icon', action='store_true', 
                        help='Also convert app-icon.svg and splash.svg in the root directory')
    
    args = parser.parse_args()
    
    # Convert SVGs in assets directory
    start_dir = args.dir
    output_dir = args.output
    converted = convert_all_svgs(start_dir, output_dir, args.scale, args.background)
    
    # Optionally convert root app-icon.svg and splash.svg
    if args.app_icon:
        for root_svg in ['app-icon.svg', 'splash.svg']:
            if os.path.exists(root_svg):
                print(f"Converting root {root_svg}...")
                if args.output:
                    output_path = os.path.join(args.output, root_svg.replace('.svg', '.png'))
                else:
                    output_path = root_svg.replace('.svg', '.png')
                
                try:
                    cairosvg.svg2png(
                        url=root_svg,
                        write_to=output_path,
                        scale=args.scale,
                        background_color=args.background
                    )
                    converted.append(output_path)
                    print(f"  Created {output_path}")
                except Exception as e:
                    print(f"Error converting {root_svg}: {e}")
    
    print(f"\nConversion complete! Generated {len(converted)} PNG files")
    
    # Special handling for app icon
    if 'app-icon.png' in [os.path.basename(p) for p in converted]:
        print("\nNote: For Expo, you may need to manually add app icon references in app.json:")
        print('  "icon": "./app-icon.png",')
        print('  "android": { "adaptiveIcon": { "foregroundImage": "./app-icon.png" } }')