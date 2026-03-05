# Security snippets

## Nginx deny rules for dotfiles and env files

```nginx
# Block dotfiles except for ACME challenges.
location ~ /\.(?!well-known)(?:.*)$ {
  deny all;
}

# Defense-in-depth for environment files.
location ~* /\.env(\.|$) {
  deny all;
}
```
