# EmployeeDashboard

- 1) If the completion date is less than the target date then the ATS is 100% and the status is Ontime
- 2) if the completion is on the same date of target date then also same
- 3) if the startdate = completion date = target date then 100 %
- 4) if the startdate = targetdate but the completion date is next day of target date then ats will be (1 / (completiondate - targetdate) + 1)
- 5) 