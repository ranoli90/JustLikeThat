'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

export default function ValidationPage() {
  const userJourney = [
    {
      step: 'Signup',
      description: 'User creates a new account with email and password',
      validation: 'All required fields are filled, password meets complexity requirements',
    },
    {
      step: 'Email Verification',
      description: 'User receives and verifies email address',
      validation: 'Verification code is valid, email is confirmed',
    },
    {
      step: 'Intake Questions',
      description: 'User completes candidate intake form',
      validation: 'All required fields are filled, data format is valid',
    },
    {
      step: 'Profile Creation',
      description: 'User creates and completes candidate profile',
      validation: 'Profile is complete, all required information is provided',
    },
    {
      step: 'Dashboard',
      description: 'User views job matches and application status',
      validation: 'Job matches are displayed, application status is accurate',
    },
    {
      step: 'Settings',
      description: 'User manages account and automation settings',
      validation: 'Settings are saved correctly, changes are reflected',
    },
  ];

  const accessibilityChecklist = [
    {
      category: 'WCAG 2.1 AA Compliance',
      items: [
        'Contrast ratio of text and background meets 4.5:1 minimum',
        'All images have appropriate alt text',
        'Form fields have proper labels and error messages',
        'Navigation is usable with keyboard only',
        'Color is not the only means of conveying information',
      ],
    },
    {
      category: 'shadcn/ui Accessibility',
      items: [
        'All components have appropriate ARIA labels and roles',
        'Form validation errors are clearly visible and accessible',
        'Buttons and interactive elements have sufficient click targets',
        'Focus states are visible and consistent',
        'Modal dialogs are accessible and properly labeled',
      ],
    },
    {
      category: 'Testing',
      items: [
        'Screen reader testing with NVDA, VoiceOver, and JAWS',
        'Keyboard navigation testing (Tab, Shift+Tab, Enter)',
        'Color contrast testing with tools like Axe or Lighthouse',
        'Responsive design testing on various screen sizes',
        'Cross-browser compatibility testing',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Validation Checklist</h1>
          <p className="mt-2 text-gray-600">
            User journey and accessibility validation checklist
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* User Journey Table */}
          <Card>
            <CardHeader>
              <CardTitle>User Journey</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Step
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Validation
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {userJourney.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="font-medium text-gray-900">{item.step}</span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="text-sm text-gray-600">{item.description}</span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="text-sm text-gray-600">{item.validation}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Accessibility Checklist */}
          <Card>
            <CardHeader>
              <CardTitle>Accessibility Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {accessibilityChecklist.map((category, index) => (
                  <div key={index}>
                    <h3 className="mb-3 font-medium text-gray-900">{category.category}</h3>
                    <div className="space-y-2">
                      {category.items.map((item, subIndex) => (
                        <div key={subIndex} className="flex items-start">
                          <div className="mt-1 shrink-0">
                            <div className="size-2 rounded-full bg-blue-500"></div>
                          </div>
                          <p className="ml-3 text-sm text-gray-600">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
