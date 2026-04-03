// Test Report Generator for UI Tests
// Run after Playwright tests: npx ts-node generate-report.ts

import { promises as fs } from 'fs';
import path from 'path';

interface TestCase {
  id: string;
  title: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  screenshot?: string;
}

interface ReportData {
  project: string;
  generatedAt: string;
  totalTests: number;
  passed: number;
  failed: number;
  passRate: number;
  duration: number;
  testCases: TestCase[];
}

async function findLatestResults(): Promise<string | null> {
  const resultsDir = path.join(__dirname, '../test-results');
  try {
    const files = await fs.readdir(resultsDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    if (jsonFiles.length > 0) {
      return path.join(resultsDir, jsonFiles[0]);
    }
  } catch (e) {
    // Directory might not exist
  }
  return null;
}

async function generateReport(): Promise<void> {
  const resultsPath = await findLatestResults();
  
  const report: ReportData = {
    project: process.cwd().split('/').pop() || 'Unknown',
    generatedAt: new Date().toISOString(),
    totalTests: 0,
    passed: 0,
    failed: 0,
    passRate: 0,
    duration: 0,
    testCases: []
  };

  if (resultsPath) {
    try {
      const content = await fs.readFile(resultsPath, 'utf-8');
      const data = JSON.parse(content);
      
      // Parse Playwright JSON format
      if (data.stats) {
        report.totalTests = data.stats.total || 0;
        report.passed = data.stats.expected || 0;
        report.failed = data.stats.unexpected || 0;
        report.duration = (data.stats.duration || 0) / 1000;
        report.passRate = report.totalTests > 0 
          ? (report.passed / report.totalTests * 100) : 0;
      }
      
      if (Array.isArray(data.tests)) {
        report.testCases = data.tests.map((t: any, i: number) => ({
          id: `TC-${String(i + 1).padStart(3, '0')}`,
          title: t.title || 'Untitled Test',
          status: t.ok ? 'passed' : 'failed',
          duration: (t.duration || 0) / 1000,
          error: t.errors?.[0]?.message
        }));
      }
    } catch (e) {
      console.error('Error reading results:', e);
    }
  }

  // Generate Markdown Report
  const markdown = generateMarkdown(report);
  
  const reportPath = path.join(__dirname, '../TEST-REPORT.md');
  await fs.writeFile(reportPath, markdown);
  
  console.log(`\n✅ Test Report Generated: ${reportPath}\n`);
  console.log(`📊 Summary:`);
  console.log(`   Total: ${report.totalTests}`);
  console.log(`   Passed: ${report.passed} (${report.passRate.toFixed(1)}%)`);
  console.log(`   Failed: ${report.failed}`);
  console.log(`   Duration: ${report.duration.toFixed(1)}s\n`);
}

function generateMarkdown(data: ReportData): string {
  const lines: string[] = [];
  
  lines.push('# UI Test Report');
  lines.push('');
  lines.push(`**Project:** ${data.project}`);
  lines.push(`**Generated:** ${new Date(data.generatedAt).toLocaleString()}`);
  lines.push('');
  
  // Summary Box
  lines.push('## 📊 Summary');
  lines.push('');
  lines.push('```');
  lines.push(`  Total Tests  : ${data.totalTests}`);
  lines.push(`  ✅ Passed    : ${data.passed}`);
  lines.push(`  ❌ Failed    : ${data.failed}`);
  lines.push(`  Pass Rate    : ${data.passRate.toFixed(1)}%`);
  lines.push(`  Duration     : ${data.duration.toFixed(1)}s`);
  lines.push('```');
  lines.push('');

  // Test Results Table
  lines.push('## 🧪 Test Results');
  lines.push('');
  lines.push('| ID | Test Case | Status | Duration |');
  lines.push('|----|-----------|--------|----------|');
  
  for (const tc of data.testCases) {
    const status = tc.status === 'passed' ? '✅ PASS' : '❌ FAIL';
    lines.push(`| ${tc.id} | ${tc.title} | ${status} | ${tc.duration.toFixed(1)}s |`);
  }
  lines.push('');

  // Failed Tests Detail
  if (data.failed > 0) {
    lines.push('## 🔴 Failed Tests Detail');
    lines.push('');
    
    for (const tc of data.testCases.filter(t => t.status === 'failed')) {
      lines.push(`### ${tc.id}: ${tc.title}`);
      lines.push('');
      lines.push(`**Duration:** ${tc.duration.toFixed(1)}s`);
      lines.push('');
      lines.push('**Error:**');
      lines.push('```');
      lines.push(tc.error || 'Unknown error');
      lines.push('```');
      lines.push('');
      
      // Look for screenshot
      const screenshotName = tc.title.replace(/\s+/g, '-').toLowerCase() + '-fail.png';
      const screenshotPath = path.join(__dirname, `../tests/e2e/reports/${screenshotName}`);
      lines.push('**Screenshot:**');
      lines.push(`![Failure](tests/e2e/reports/${screenshotName})`);
      lines.push('');
    }
  }

  // Passed Tests
  if (data.passed > 0) {
    lines.push('## ✅ Passed Tests');
    lines.push('');
    lines.push(`All ${data.passed} test(s) passed successfully:`);
    lines.push('');
    
    for (const tc of data.testCases.filter(t => t.status === 'passed')) {
      const screenshotName = tc.title.replace(/\s+/g, '-').toLowerCase() + '-pass.png';
      lines.push(`- ${tc.id}: ${tc.title} (${tc.duration.toFixed(1)}s)`);
    }
    lines.push('');
  }

  // Sign-off
  lines.push('---');
  lines.push('');
  lines.push('*Report generated by AI Agent - UI Testing Skill*');

  return lines.join('\n');
}

generateReport().catch(console.error);
