# PowerShell script to update headers in category pages

$categories = @(
    @{file="business.html"; active="Business"; placeholder="Search business..."},
    @{file="sports.html"; active="Sports"; placeholder="Search sports..."},
    @{file="tech.html"; active="Tech"; placeholder="Search tech..."},
    @{file="entertainment.html"; active="Entertainment"; placeholder="Search entertainment..."}
)

$newHeader = @"
  <!-- Modern Navbar -->
  <nav class="navbar navbar-expand-lg navbar-light bg-white sticky-top shadow-sm">
    <div class="container">
      <a class="navbar-brand fw-bold fs-2 me-4" href="../index.html">
        <span class="text-primary">Khabar</span>chi
      </a>
      
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav me-auto">
          <li class="nav-item">
            <a class="nav-link fw-medium" href="../index.html">Home</a>
          </li>
          <li class="nav-item">
            <a class="nav-link fw-medium" href="politics.html">Politics</a>
          </li>
          <li class="nav-item">
            <a class="nav-link ACTIVE_PLACEHOLDER fw-medium" href="CATEGORY_FILE">CATEGORY_NAME</a>
          </li>
          <li class="nav-item">
            <a class="nav-link fw-medium" href="sports.html">Sports</a>
          </li>
          <li class="nav-item">
            <a class="nav-link fw-medium" href="tech.html">Tech</a>
          </li>
          <li class="nav-item">
            <a class="nav-link fw-medium" href="entertainment.html">Entertainment</a>
          </li>
        </ul>
        
        <form class="d-flex" role="search">
          <input class="form-control me-2" type="search" placeholder="SEARCH_PLACEHOLDER" aria-label="Search">
          <button class="btn btn-primary" type="submit"><i class="bi bi-search"></i></button>
        </form>
      </div>
    </div>
  </nav>
"@

foreach ($category in $categories) {
    $filePath = "categories\$($category.file)"
    
    Write-Host "Updating $filePath..."
    
    # Read the file
    $content = Get-Content $filePath -Raw
    
    # Create customized header for this category
    $customHeader = $newHeader
    $customHeader = $customHeader -replace "CATEGORY_FILE", $category.file
    $customHeader = $customHeader -replace "CATEGORY_NAME", $category.active
    $customHeader = $customHeader -replace "SEARCH_PLACEHOLDER", $category.placeholder
    
    # Set active class for the correct category
    if ($category.active -eq "Business") {
        $customHeader = $customHeader -replace 'href="business.html">Business', 'href="business.html">Business'
        $customHeader = $customHeader -replace "ACTIVE_PLACEHOLDER", "active"
    } elseif ($category.active -eq "Sports") {
        $customHeader = $customHeader -replace 'href="sports.html">Sports', 'href="sports.html">Sports'
        $customHeader = $customHeader -replace "ACTIVE_PLACEHOLDER", "active"
    } elseif ($category.active -eq "Tech") {
        $customHeader = $customHeader -replace 'href="tech.html">Tech', 'href="tech.html">Tech'
        $customHeader = $customHeader -replace "ACTIVE_PLACEHOLDER", "active"
    } elseif ($category.active -eq "Entertainment") {
        $customHeader = $customHeader -replace 'href="entertainment.html">Entertainment', 'href="entertainment.html">Entertainment'
        $customHeader = $customHeader -replace "ACTIVE_PLACEHOLDER", "active"
    }
    
    # Remove the ACTIVE_PLACEHOLDER if it wasn't replaced
    $customHeader = $customHeader -replace "ACTIVE_PLACEHOLDER ", ""
    
    # Update the file content (find and replace the old header)
    $oldHeaderPattern = "(?s)  <!-- Top Header with Logo -->.*?</header>"
    $updatedContent = $content -replace $oldHeaderPattern, $customHeader
    
    # Write the updated content back to file
    Set-Content -Path $filePath -Value $updatedContent -Encoding UTF8
    
    Write-Host "Updated $filePath successfully!"
}

Write-Host "All category pages updated!"
